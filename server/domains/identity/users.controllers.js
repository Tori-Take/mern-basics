const User = require('./user.model');
const Tenant = require('../organization/tenant.model');
const bcrypt = require('bcryptjs');
const Role = require('../organization/role.model');
const { Application } = require('../applications/application.model'); // ★ 分割代入で正しくインポート
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { getAccessibleTenantIds } = require('../../core/services/permissionService');
const UserRepository = require('./repositories/user.repository');
const UserService = require('./services/user.service');

const userRepository = new UserRepository();
const userService = new UserService(userRepository);

/**
 * @class UserController
 * @description Handles all business logic for user-related operations.
 */
class UserController {
  /**
   * @description Register a new tenant owner and their organization.
   * @route POST /api/identity/users/register
   * @access Public
   */
  static async register(req, res) {
    try {
      // --- 入力値のバリデーション ---
      if (!req.body.username || !req.body.email || !req.body.password || !req.body.tenantName) {
        return res.status(400).json({ message: 'すべての必須項目（組織名, ユーザー名, メールアドレス, パスワード）を入力してください。' });
      }

      const result = await userService.registerNewTenantAndOwner(req.body);
      res.status(201).json(result);
    } catch (err) {
      // サービス層からスローされたエラーをハンドリング
      if (process.env.NODE_ENV !== 'test') {
        console.error('Registration Error:', err.message);
      }
      res.status(err.statusCode || 500).json({ message: err.message || 'サーバーエラーが発生しました。' });
    }
  }

  /**
   * @description Authenticate user and get token
   * @route POST /api/users/login
   * @access Public
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body; // 1. HTTPリクエストからデータを取得
      if (!email || !password) { // 2. 簡単な入力チェック
        return res.status(400).json({ message: 'メールアドレスとパスワードを入力してください。' });
      }

      // 3. ビジネスロジックをサービスに委譲
      const result = await userService.loginUser(email, password);

      res.json(result); // 4. 結果をクライアントに返す
    } catch (err) {
      // 5. サービス層からのエラーをハンドリング
      res.status(err.statusCode || 500).json({ message: err.message || 'サーバーエラーが発生しました。' });
    }
  }

  /**
   * @description Get user from token
   * @route GET /api/users/auth
   * @access Private
   */
  static async getAuthUser(req, res) {
    try {
      const userObject = await userService.getAuthenticatedUser(req.user.id);
      res.json(userObject);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        message: err.message || 'サーバーエラーが発生しました。',
      });
    }
  }

  /**
   * @description Update logged-in user's profile (email)
   * @route PUT /api/users/profile
   * @access Private
   */
  static async updateProfile(req, res) {
    try {
      // 修正: usernameとemailの両方をリクエストボディから受け取る
      const { username, email } = req.body;
      const userObject = await userService.updateUserProfile(req.user.id, { username, email });

      // サービス層から返された整形済みのユーザーオブジェクトをそのまま返す
      res.json(userObject);
    } catch (err) {
      res.status(err.statusCode || 500).json({ message: err.message || 'サーバーエラーが発生しました。' });
    }
  }

  /**
   * @description Update logged-in user's password
   * @route PUT /api/users/profile/password
   * @access Private
   */
  static async updatePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      const result = await userService.updateUserPassword(userId, currentPassword, newPassword);
      res.json(result);
    } catch (err) {
      // サービス層からスローされたエラーをハンドリング
      res.status(err.statusCode || 500).json({ message: err.message || 'サーバーエラーが発生しました。' });
    }
  }

  /**
   * @description Get a list of users to whom tasks can be assigned (own department and below)
   * @route GET /api/users/assignable
   * @access Private
   */
  static async getAssignableUsers(req, res) {
    try {
      // ★ログ1: コントローラーが呼び出されたことを確認
      console.log('--- [DEBUG] UserController: getAssignableUsers called ---');
      const users = await userService.getAssignableUsers(req.user);
      res.json(users);
    } catch (err) {
      // ★ログ4: もしここでエラーが起きたら詳細を出力
      console.error('--- [DEBUG] UserController: Error caught ---', err);
      res.status(err.statusCode || 500).json({ message: err.message || 'サーバーエラーが発生しました。' });
    }  }

  /**
   * @description Get all users (for admins)
   * @route GET /api/users
   * @access Private/Admin
   */
  static async getAllUsers(req, res) {
    try {
      const users = await userService.getAllAccessibleUsers(req.user.tenantId?._id);
      res.json(users);
    } catch (err) {
      res.status(err.statusCode || 500).json({ message: err.message || 'サーバーエラーが発生しました。' });
    }  }

  /**
   * @description Get a specific user by ID (for admins)
   * @route GET /api/users/:id
   * @access Private/Admin
   */
  static async getUserById(req, res) {
    try {
      const user = await userService.getAccessibleUserById(req.params.id, req.user);
      res.json(user);
    } catch (err) {
      // ObjectIdエラーなども含めてサービス層でハンドリングされる
      res.status(err.statusCode || 500).json({ message: err.message || 'サーバーエラーが発生しました。' });
    }
  }

  /**
   * @description Update user info (for admins)
   * @route PUT /api/users/:id
   * @access Private/Admin
   */
  static async updateUser(req, res) {
    try {
      // ★ 修正: permissionsフィールドも更新対象に含める
      const updatedUser = await userService.updateUserByAdmin(
        req.params.id,
        req.body, // username, email, roles, status, tenantId, permissions を含む
        req.user // ★ 修正後：管理者自身の完全なユーザーオブジェクトを渡す
      );
      res.json(updatedUser);
    } catch (err) {
      res.status(err.statusCode || 500).json({ message: err.message || 'サーバーエラーが発生しました。' });
    }  }

  /**
   * @description Create a new user (for admins)
   * @route POST /api/users
   * @access Private/Admin
   */
  static async createUser(req, res) {
    try {
      const { username, email, password, tenantId } = req.body; // tenantIdも受け取る
      if (!username || !email || !password) {
        return res.status(400).json({ message: 'ユーザー名、メールアドレス、パスワードは必須です。' });
      }
      const userObject = await userService.createUserByAdmin(req.body, tenantId || req.user.tenantId);
      res.status(201).json(userObject);
    } catch (err) {
      res.status(err.statusCode || 500).json({ message: err.message || 'サーバーエラーが発生しました。' });
    }  }

  /**
   * @description Delete a user (for admins)
   * @route DELETE /api/users/:id
   * @access Private/Admin
   */
  static async deleteUser(req, res) {
    try {
      const result = await userService.deleteUserByAdmin(req.params.id, req.user.id, req.user.tenantId?._id);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ message: err.message || 'サーバーエラーが発生しました。' });
    }  }

  /**
   * @description Force password reset for a user (for admins)
   * @route POST /api/users/:id/force-reset
   * @access Private/Admin
   */
  static async forcePasswordReset(req, res) {
    try {
      const { temporaryPassword } = req.body;
      if (!temporaryPassword || temporaryPassword.length < 6) {
        return res.status(400).json({ message: '6文字以上の一時パスワードを指定してください。' });
      }
      const result = await userService.forcePasswordResetByAdmin(req.params.id, temporaryPassword, req.user.tenantId?._id);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ message: err.message || 'サーバーエラーが発生しました。' });
    }  }

  /**
   * @description User resets their own forced password
   * @route POST /api/users/force-reset-password
   * @access Private
   */
  static async userForceResetPassword(req, res) {
    try {
      const { newPassword } = req.body; // バリデーションのため
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'パスワードは6文字以上で入力してください。' });
      }
      const result = await userService.updateUserPassword(req.user.id, null, newPassword); // updateUserPasswordを再利用（currentPasswordは不要）
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ message: err.message || 'サーバーエラーが発生しました。' });
    }  }
}

/**
 * CSVからユーザーを一括登録・更新する
 */
UserController.bulkImportUsers = async (req, res) => {
  // ★★★ デバッグ用コンソールログを追加 ★★★
  console.log('--- [DEBUG] Bulk Import API Called ---');
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  // ★★★ ここまで ★★★

  const { users: csvData } = req.body;
  const operator = req.user;

  if (!Array.isArray(csvData) || csvData.length === 0) {
    return res.status(400).json({ message: 'アップロードデータが空か、形式が正しくありません。' });
  }

  const results = {
    successCount: 0,
    errorCount: 0,
    errors: [],
  };

  try {
    // --- 前処理：検証用のデータを一括取得 ---
    const accessibleTenantIds = await getAccessibleTenantIds(operator);

    // 1. アクセス可能なテナントをMap形式で取得 (名前 -> ID)
    // ★★★ 権限継承ロジックをここでも適用 ★★★
    const accessibleTenantsRaw = await Tenant.find({ _id: { $in: accessibleTenantIds } }).select('name _id parent availablePermissions').lean();
    const tenantMapForInheritance = new Map(accessibleTenantsRaw.map(t => [t._id.toString(), t]));

    const getInheritedPermissions = (tenantId) => {
      const tenant = tenantMapForInheritance.get(tenantId.toString());
      if (!tenant) return [];
      const parentPermissions = tenant.parent ? getInheritedPermissions(tenant.parent) : [];
      return [...new Set([...parentPermissions, ...(tenant.availablePermissions || [])])];
    };

    const accessibleTenants = accessibleTenantsRaw.map(tenant => {
      tenant.availablePermissions = getInheritedPermissions(tenant._id);
      return tenant;
    });
    // ★★★ ここまで ★★★

    const tenantNameMap = new Map(accessibleTenants.map(t => [t.name, t._id]));

    // 2. 利用可能なロールをSet形式で取得 (名前)
    const PROTECTED_ROLES = ['user', 'admin', 'tenant-superuser'];
    const customRoles = await Role.find({ tenantId: operator.tenantId });
    const validRoleSet = new Set([...PROTECTED_ROLES, ...customRoles.map(r => r.name)]);

    // 3. 利用可能な全アプリケーション権限をSet形式で取得 (permissionKey)
    const allApplications = await Application.find({});
    const validPermissionSet = new Set(allApplications.map(app => app.permissionKey));

    // --- 各行の処理 ---
    for (const [index, row] of csvData.entries()) {
      const rowNum = index + 2; // CSVの行番号 (ヘッダー分+1)
      let validationErrors = [];

      // --- 行ごとの検証（門番） ---
      // ★ 修正: CSVの行データから各変数を宣言する行を復活させる
      const { _id, username, email, password, tenantName, roles: rolesStr, permissions: permissionsStr, status } = row;

      // ★ 修正: 重複していた行を削除

      // 1. 必須項目のチェック
      if (!username) validationErrors.push('ユーザー名は必須です。');
      if (!email) validationErrors.push('メールアドレスは必須です。');
      if (!_id && !password) validationErrors.push('新規登録の場合、passwordは必須です。');

      // 2. 所属部署の検証
      let targetTenantId = null;
      let targetTenantAvailablePermissions = []; // ★ 権限検証用に部署の利用可能権限を保持
      if (!tenantName) {
        validationErrors.push('所属部署は必須です。');
      } else if (!tenantNameMap.has(tenantName)) {
        validationErrors.push(`所属部署「${tenantName}」は存在しないか、アクセス権がありません。`);
      } else {
        targetTenantId = tenantNameMap.get(tenantName);
        // ★ 部署の利用可能権限を取得
        const targetTenant = accessibleTenants.find(t => t._id.equals(targetTenantId));
        if (targetTenant) {
          targetTenantAvailablePermissions = targetTenant.availablePermissions || [];
        }
      }

      // 3. 役割の検証
      const roles = rolesStr ? rolesStr.split(',').map(r => r.trim()).filter(Boolean) : [];
      if (roles.length === 0) {
        validationErrors.push('役割は必須です。');
      } else {
        for (const role of roles) {
          if (!validRoleSet.has(role)) {
            validationErrors.push(`役割「${role}」は存在しないか、利用できません。`);
          }
        }
      }
      
      // 4. ステータスの検証
      if (status && !['active', 'inactive'].includes(status)) {
        validationErrors.push(`ステータスは 'active' または 'inactive' である必要があります。`);
      }

      // 5. 利用可能アプリの検証
      const permissions = permissionsStr ? permissionsStr.split(',').map(p => p.trim()).filter(Boolean) : [];
      for (const pKey of permissions) {
        if (!validPermissionSet.has(pKey)) {
          validationErrors.push(`利用可能アプリ「${pKey}」は存在しません。`);
        }
      }

      // ★ 6. 付与しようとしている権限が、所属部署で許可されているか検証
      if (!operator.roles.includes('superuser') && !permissions.every(p => targetTenantAvailablePermissions.includes(p))) {
        validationErrors.push('所属部署で許可されていない権限を付与しようとしています。');
      }

      // 7. 更新の場合、対象ユーザーへのアクセス権をチェック
      if (_id) {
          const userToUpdate = await User.findById(_id);
          if (!userToUpdate) {
              validationErrors.push(`ID「${_id}」のユーザーが見つかりません。`);
          } else if (!accessibleTenantIds.some(id => id.equals(userToUpdate.tenantId))) {
              validationErrors.push(`ID「${_id}」のユーザーを更新する権限がありません。`);
          }
      }

      // --- 検証結果に応じた処理 ---
      if (validationErrors.length > 0) {
        results.errorCount++;
        results.errors.push({ row: rowNum, messages: validationErrors });
        continue; // 次の行へ
      }

      // --- 処理の分岐 ---
      try {
        if (_id) {
          // 更新処理
          const userToUpdate = await User.findById(_id);
          userToUpdate.username = username;
          userToUpdate.email = email;
          userToUpdate.tenantId = targetTenantId;
          userToUpdate.roles = roles;
      userToUpdate.permissions = permissions;
          if (status) userToUpdate.status = status;
          if (password) {
            const salt = await bcrypt.genSalt(10);
            userToUpdate.password = await bcrypt.hash(password, salt);
          }
          await userToUpdate.save();
        } else {
          // 新規作成処理
          await User.create({ username, email, password, tenantId: targetTenantId, roles, permissions, status: status || 'active' });
        }
        results.successCount++;
      } catch (dbError) {
        results.errorCount++;
        // ★★★ エラーメッセージを分かりやすく変換 ★★★
        let userFriendlyMessage = dbError.message;
        if (dbError.code === 11000) {
          // MongoDBの重複キーエラーの場合
          if (dbError.keyPattern?.email) {
            userFriendlyMessage = `メールアドレス「${email}」は既に使用されています。`;
          } else if (dbError.keyPattern?.username) {
            userFriendlyMessage = `ユーザー名「${username}」は既に使用されています。`;
          } else {
            userFriendlyMessage = '一意であるべき項目が重複しています。';
          }
        }
        results.errors.push({ row: rowNum, messages: [userFriendlyMessage] });
      }
    }
    res.status(200).json(results);
  } catch (err) {
    console.error('Bulk import error:', err);
    res.status(500).json({ message: 'サーバー内部で予期せぬエラーが発生しました。' });
  }
};

module.exports = UserController;