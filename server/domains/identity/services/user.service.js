const bcrypt = require('bcryptjs');
const Tenant = require('../../organization/tenant.model');
const Role = require('../../organization/role.model');
const generateToken = require('../../../core/utils/generateToken');
const tenantService = require('../../organization/services/tenant.service'); // ★ tenant.serviceをインポート
const { getAccessibleTenantIds } = require('../../../core/services/permissionService');

/**
 * @class UserService
 * @description ユーザーに関するビジネスロジックを担当します。
 * HTTPリクエストやレスポンスには関与しません。
 */
class UserService {
  /**
   * @param {UserRepository} userRepository - ユーザーリポジトリのインスタンス。
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * ユーザーのパスワードを更新します。
   * @param {string} userId - ユーザーのID。
   * @param {string} currentPassword - 現在のパスワード。
   * @param {string} newPassword - 新しいパスワード。
   * @returns {Promise<{message: string}>} 成功メッセージ。
   * @throws {Error} ユーザーが見つからない、またはパスワードが一致しない場合にエラーをスローします。
   */
  async updateUserPassword(userId, currentPassword, newPassword) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      const error = new Error('ユーザーが見つかりません。');
      error.statusCode = 404;
      throw error;
    }

    // 通常のパスワード変更の場合のみ、現在のパスワードを検証する
    if (currentPassword !== null) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        const error = new Error('現在のパスワードが正しくありません。');
        error.statusCode = 400;
        throw error;
      }
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.forcePasswordReset = false; // パスワード更新時にリセットフラグを解除する
    await this.userRepository.save(user);

    return { message: 'パスワードが正常に更新されました。' };
  }

  /**
   * 新しいテナント（組織）とそのオーナーアカウントを登録します。
   * @param {object} registrationData - 登録データ。
   * @param {string} registrationData.tenantName - 組織名。
   * @param {string} registrationData.username - ユーザー名。
   * @param {string} registrationData.email - メールアドレス。
   * @param {string} registrationData.password - パスワード。
   * @returns {Promise<{message: string}>} 成功メッセージ。
   * @throws {Error} バリデーションエラーや重複エラーの場合にエラーをスローします。
   */
  async registerNewTenantAndOwner({ tenantName, username, email, password }) {
    // --- テナント名とメールアドレスの重複チェック ---
    const existingTenant = await Tenant.findOne({ name: tenantName });
    if (existingTenant) {
      const error = new Error('その組織名は既に使用されています。');
      error.statusCode = 400;
      throw error;
    }
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      const error = new Error('このメールアドレスは既に使用されています。');
      error.statusCode = 400;
      throw error;
    }

    // --- 1. 新しいテナントを作成 ---
    const newTenant = new Tenant({ name: tenantName });
    await newTenant.save();

    // --- 2. 新しいテナント用の基本ロールを作成 ---
    await Role.insertMany([
      { name: 'user', description: '一般ユーザー', tenantId: newTenant._id },
      { name: 'admin', description: '管理者', tenantId: newTenant._id }
    ]);

    // --- 3. パスワードのハッシュ化 ---
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // --- 4. 新しいユーザー（最初の管理者）を作成 ---
    await this.userRepository.create({
      tenantId: newTenant._id,
      username,
      email,
      password: hashedPassword,
      roles: ['user', 'admin', 'tenant-superuser'], // ★ tenant-superuserロールを追加
    });

    return { message: 'ユーザー登録が成功しました。' };
  }

  /**
   * ユーザーを認証し、トークンを返します。
   * @param {string} email - ユーザーのメールアドレス。
   * @param {string} password - ユーザーのパスワード。
   * @returns {Promise<{token: string, user?: object, forceReset?: boolean}>} 認証トークンとユーザー情報。
   * @throws {Error} 認証に失敗した場合にエラーをスローします。
   */
  async loginUser(email, password) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      const error = new Error('ユーザー名またはパスワードが無効です。');
      error.statusCode = 400;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const error = new Error('ユーザー名またはパスワードが無効です。');
      error.statusCode = 400;
      throw error;
    }

    if (user.status !== 'active') {
      const error = new Error('このアカウントは現在利用できません。');
      error.statusCode = 403;
      throw error;
    }

    const token = generateToken(user.id);

    if (user.forcePasswordReset) {
      return { token, forceReset: true };
    }

    const userToReturn = await this.userRepository.findUserForLoginResponse(user.id);
    return { token, user: userToReturn };
  }

  /**
   * 認証済みユーザーの情報を取得し、フロントエンド用に整形します。
   * @param {string} userId - ユーザーのID。
   * @returns {Promise<object>} 整形されたユーザーオブジェクト。
   * @throws {Error} ユーザーが見つからない場合にエラーをスローします。
   */
  async getAuthenticatedUser(userId) {
    const user = await this.userRepository.findAuthUserById(userId);

    if (!user) {
      const error = new Error('ユーザーが見つかりません。');
      error.statusCode = 404;
      throw error;
    }

    const userObject = user.toObject();
    userObject.isTopLevelAdmin = user.roles.includes('admin') && user.tenantId?.parent === null;
    userObject.name = userObject.username;

    return userObject;
  }

  /**
   * ユーザーのプロフィール情報（メールアドレス）を更新します。
   * @description Updates a user's profile information (username, email).
   * @param {string} userId - ユーザーのID。
   * @param {object} updateData - An object containing the data to update (e.g., { username, email }).
   * @returns {Promise<object>} 更新され、整形されたユーザーオブジェクト。
   * @throws {Error} ユーザーが見つからない、またはメールアドレスが重複している場合にエラーをスローします。
   * @throws {CustomError} If user not found, or if email/username is already taken.
   */
  async updateUserProfile(userId, updateData) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      const err = new Error('ユーザーが見つかりません。');
      err.statusCode = 404;
      throw err;
    }

    // 変更があったかどうかを追跡するフラグ
    let hasChanges = false;

    // 1. ユーザー名の更新処理
    if (updateData.username && updateData.username !== user.username) {
      await this._validateAndSetUsername(user, updateData.username);
      hasChanges = true;
    }

    // 2. メールアドレスの更新処理
    if (updateData.email && updateData.email !== user.email) {
      await this._validateAndSetEmail(user, updateData.email);
      hasChanges = true;
    }

    // 3. 変更があった場合のみDBに保存
    if (hasChanges) {
      await this.userRepository.save(user);
    }

    return this.getAuthenticatedUser(user._id); // 整形処理を共通化
  }

  async _validateAndSetUsername(user, newUsername) {
    const existingUser = await this.userRepository.findByUsernameInTenant(newUsername, user.tenantId, user._id);
    if (existingUser) {
      const err = new Error('このユーザー名は既に使用されています。');
      err.statusCode = 400;
      throw err;
    }
    user.username = newUsername;
  }

  async _validateAndSetEmail(user, newEmail) {
    const existingUser = await this.userRepository.findByEmail(newEmail);
    // 他のユーザーがこのメールアドレスを使用していないかチェック
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      const err = new Error('このメールアドレスは既に使用されています。');
      err.statusCode = 400;
      throw err;
    }
    user.email = newEmail;
  }

  /**
   * タスク割り当て可能なユーザーリストを取得します。
   * @param {object} operator - リクエスト元ユーザーのオブジェクト。
   * @returns {Promise<User[]>} ユーザーの配列。
   */
  async getAssignableUsers(operator) {
    // 1. 操作者の組織のルートを見つける
    const rootTenantId = await tenantService.findOrganizationRoot(operator.tenantId);
    if (!rootTenantId) return [];

    // 2. ルート配下の全テナントIDを取得する
    const hierarchyTenants = await tenantService.getTenantHierarchy(rootTenantId);
    const allTenantIdsInOrg = [rootTenantId, ...hierarchyTenants.map(t => t._id)];

    // 3. ユーザーを取得し、tenantIdをpopulateする
    const users = await this.userRepository.findAssignable(allTenantIdsInOrg);
    // Userモデルの静的populateメソッドを使い、取得済みの配列に対してpopulateを実行する
    return await User.populate(users, { path: 'tenantId', select: 'name' });
  }

  /**
   * 管理者がアクセス可能な全ユーザーのリストを取得します。
   * @param {string} tenantId - リクエスト元ユーザーのテナントID。
   * @returns {Promise<User[]>} ユーザーの配列。
   */
  async getAllAccessibleUsers(tenantId) {
    const accessibleTenantIds = await getAccessibleTenantIds(tenantId);
    return this.userRepository.findAccessibleUsers(accessibleTenantIds);
  }

  /**
   * 管理者がアクセス可能な特定のユーザーを取得します。
   * @param {string} userId - 取得対象のユーザーID。
   * @param {object} adminUser - 操作を実行している管理者ユーザーのオブジェクト。
   * @returns {Promise<User>} ユーザーオブジェクト。
   */
  async getAccessibleUserById(userId, adminUser) {
    const accessibleTenantIds = await getAccessibleTenantIds(adminUser);
    const user = await this.userRepository.findAccessibleUserById(userId, accessibleTenantIds);
    if (!user) {
      const error = new Error('ユーザーが見つからないか、アクセス権がありません。');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  /**
   * 管理者がユーザー情報（ロール、ステータスなど）を更新します。
   * @param {string} userIdToUpdate - 更新対象のユーザーID。
   * @param {object} updateData - 更新データ。
   * @param {string} adminTenantId - 管理者のテナントID。
   * @param {User} adminUser - 操作を実行している管理者ユーザーのオブジェクト。
   * @returns {Promise<User>} 更新されたユーザーオブジェクト。
   */
  async updateUserByAdmin(userIdToUpdate, updateData, adminUser) {
    // ★ adminUserオブジェクトから直接IDを取得
    const accessibleTenantIds = await getAccessibleTenantIds(adminUser);
    const user = await this.userRepository.findFullAccessibleUserById(userIdToUpdate, accessibleTenantIds); // ★ 更新対象のユーザー

    if (!user) {
      const error = new Error('ユーザーが見つからないか、更新する権限がありません。');
      error.statusCode = 404;
      throw error;
    }

    const { username, email, roles, status, tenantId, permissions } = updateData;

    // --- ★★★ ここからが新しいセキュリティロジック ★★★ ---
    // tenant-superuserロールの変更を検知
    if (roles) {
      const isTenantSuperuserChanged = user.roles.includes('tenant-superuser') !== roles.includes('tenant-superuser');

      // ★★★ ここからが新しい権限チェック ★★★
      // もしtenant-superuserロールが変更され、かつ操作者が'superuser'でも'tenant-superuser'でもなければエラー
      const hasPermission = adminUser.roles.includes('superuser') || adminUser.roles.includes('tenant-superuser');

      if (isTenantSuperuserChanged && !hasPermission) {
        const error = new Error('tenant-superuserロールを変更する権限がありません。');
        error.statusCode = 403;
        throw error;
      }
    }

    // --- ★★★ 新しい権限チェックロジック ★★★ ---
    // superuserでなければ、付与する権限がテナントに許可されているか検証
    if (permissions && !adminUser.roles.includes('superuser')) {
      // ユーザーが所属する(または異動する)テナントの情報を取得
      const targetTenantId = tenantId || user.tenantId;
      const tenant = await Tenant.findById(targetTenantId);
      const availablePermissions = tenant?.availablePermissions || [];
      if (!permissions.every(p => availablePermissions.includes(p))) {
        const error = new Error('このテナントで許可されていない権限を付与することはできません。');
        error.statusCode = 403;
        throw error;
      }
    }
    // --- ★★★ ここからが新しい権限チェックロジック ★★★ ---
    // 新しい所属部署(tenantId)がリクエストに含まれている場合、その部署への異動権限を検証する
    await this._validateTenantMovePermission(user, tenantId, accessibleTenantIds);

    if (email && email !== user.email) {
      if (await this.userRepository.findByEmail(email)) {
        const error = new Error('このメールアドレスは既に使用されています。');
        error.statusCode = 400;
        throw error;
      }
      user.email = email;
    }

    if (username && username !== user.username) {
      if (await this.userRepository.findByUsernameInTenant(username, user.tenantId, user._id)) {
        const error = new Error('このユーザー名は既に使用されています。');
        error.statusCode = 400;
        throw error;
      }
      user.username = username;
    }

    if (status) user.status = status;
    if (tenantId) user.tenantId = tenantId;
    if (roles) user.roles = roles;
    if (permissions) user.permissions = permissions; // ★ permissionsを更新するロジックを追加

    return this.userRepository.save(user);
  }

  /**
   * @private
   * ユーザーの所属部署変更に関する権限を検証します。
   * @param {User} user - 異動対象のユーザーオブジェクト。
   * @param {string} targetTenantId - 異動先の部署ID。
   * @param {string[]} accessibleTenantIds - 操作者がアクセス可能な部署IDのリスト。
   * @throws {Error} 権限がない場合に403エラーをスローします。
   */
  async _validateTenantMovePermission(user, targetTenantId, accessibleTenantIds) {
    if (targetTenantId && targetTenantId.toString() !== user.tenantId.toString()) {
      const isAllowedToMove = accessibleTenantIds.some(id => id.toString() === targetTenantId.toString());
      if (!isAllowedToMove) {
        const error = new Error('指定された部署にユーザーを移動する権限がありません。');
        error.statusCode = 403;
        throw error;
      }
    }
  }

  /**
   * 管理者が新しいユーザーを作成します。
   * @param {object} userData - 新規ユーザーのデータ。
   * @param {string} targetTenantId - ユーザーを作成する対象のテナントID。
   * @returns {Promise<User>} 作成されたユーザーオブジェクト（パスワードなし）。
   */
  async createUserByAdmin(userData, targetTenantId) {
    const { username, email, password, roles, status } = userData;

    if (await this.userRepository.findForCreationCheck(email, username, targetTenantId)) {
      const error = new Error('そのユーザー名またはメールアドレスは既に使用されています。');
      error.statusCode = 400;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const savedUser = await this.userRepository.create({
      tenantId: targetTenantId,
      username,
      email,
      password: hashedPassword,
      roles: roles ? [...new Set(['user', ...roles])] : ['user'],
      status: status || 'active',
    });

    const userObject = savedUser.toObject();
    delete userObject.password;
    return userObject;
  }

  /**
   * 管理者がユーザーを削除します。
   * @param {string} userIdToDelete - 削除対象のユーザーID。
   * @param {string} adminUserId - 管理者のユーザーID。
   * @param {string} adminTenantId - 管理者のテナントID。
   * @returns {Promise<{message: string}>} 成功メッセージ。
   */
  async deleteUserByAdmin(userIdToDelete, adminUserId, adminTenantId) {
    if (userIdToDelete === adminUserId) {
      const error = new Error('自分自身のアカウントは削除できません。');
      error.statusCode = 400;
      throw error;
    }

    const accessibleTenantIds = await getAccessibleTenantIds(adminTenantId);
    const userToDelete = await this.userRepository.findFullAccessibleUserById(userIdToDelete, accessibleTenantIds);

    if (!userToDelete) {
      const error = new Error('ユーザーが見つからないか、削除する権限がありません。');
      error.statusCode = 404;
      throw error;
    }

    await this.userRepository.deleteById(userIdToDelete);
    return { message: 'ユーザーが正常に削除されました。' };
  }

  /**
   * 管理者がユーザーのパスワードリセットを強制します。
   * @param {string} userIdToReset - 対象ユーザーのID。
   * @param {string} temporaryPassword - 一時パスワード。
   * @param {string} adminTenantId - 管理者のテナントID。
   * @returns {Promise<{message: string}>} 成功メッセージ。
   */
  async forcePasswordResetByAdmin(userIdToReset, temporaryPassword, adminTenantId) {
    const accessibleTenantIds = await getAccessibleTenantIds(adminTenantId);
    const user = await this.userRepository.findFullAccessibleUserById(userIdToReset, accessibleTenantIds);
    if (!user) {
      const error = new Error('対象のユーザーが見つからないか、操作する権限がありません。');
      error.statusCode = 404;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(temporaryPassword, salt);
    user.forcePasswordReset = true;
    await this.userRepository.save(user);

    return { message: `${user.username} のパスワードが一時パスワードに更新され、リセット待機状態に設定されました。` };
  }
}

module.exports = UserService;
