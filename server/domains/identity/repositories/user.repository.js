const User = require('../user.model');

/**
 * @class UserRepository
 * @description ユーザーモデルに関するデータベース操作をカプセル化します。
 */
class UserRepository {
  /**
   * アクセス可能なテナントの中から、指定されたIDのユーザーを検索します。
   * @param {string} id - 検索するユーザーのID。
   * @param {string[]} accessibleTenantIds - アクセスが許可されているテナントIDの配列。
   * @returns {Promise<User|null>} ユーザーオブジェクト、または見つからない場合はnull。
   */
  async findAccessibleUserById(id, accessibleTenantIds) {
    return await User.findOne({
      _id: id,
      tenantId: { $in: accessibleTenantIds }
    }).select('-password');
  }

  /**
   * アクセス可能なテナントに所属する全ユーザーを検索します。
   * @param {string[]} accessibleTenantIds - アクセスが許可されているテナントIDの配列。
   * @returns {Promise<User[]>} ユーザーオブジェクトの配列。
   */
  async findAccessibleUsers(accessibleTenantIds) {
    if (accessibleTenantIds.length === 0) {
      return [];
    }
    return await User.find({ tenantId: { $in: accessibleTenantIds } })
      .select('-password')
      .sort({ createdAt: -1 });
  }

  /**
   * タスク割り当て可能なユーザー（自部署とその配下）のリストを取得します。
   * @param {string[]} accessibleTenantIds - アクセスが許可されているテナントIDの配列。
   * @returns {Promise<User[]>} ユーザーオブジェクトの配列。
   */
  async findAssignable(accessibleTenantIds) {
    return await User.find({ tenantId: { $in: accessibleTenantIds } })
      .select('username tenantId')
      .populate('tenantId', 'name')
      .sort({ username: 1 });
  }

  /**
   * メールアドレスでユーザーを検索します。
   * @param {string} email - 検索するメールアドレス。
   * @returns {Promise<User|null>} ユーザーオブジェクト、または見つからない場合はnull。
   */
  async findByEmail(email) {
    return await User.findOne({ email });
  }

  /**
   * 指定されたテナント内で重複するユーザー名を持つユーザーを検索します。
   * @param {string} username - 検索するユーザー名。
   * @param {string} tenantId - テナントのID。
   * @param {string} excludeUserId - 検索から除外するユーザーのID。
   * @returns {Promise<User|null>} ユーザーオブジェクト、または見つからない場合はnull。
   */
  async findByUsernameInTenant(username, tenantId, excludeUserId) {
    return await User.findOne({
      username,
      tenantId,
      _id: { $ne: excludeUserId }
    });
  }

  /**
   * ユーザーオブジェクトをデータベースに保存します。
   * @param {User} user - 保存するMongooseユーザーオブジェクト。
   * @returns {Promise<User>} 保存されたユーザーオブジェクト。
   */
  async save(user) {
    return await user.save();
  }

  /**
   * 新規作成時の重複チェックのためにユーザーを検索します（メールアドレス or テナント内ユーザー名）。
   * @param {string} email - チェックするメールアドレス。
   * @param {string} username - チェックするユーザー名。
   * @param {string} tenantId - ユーザーが所属するテナントのID。
   * @returns {Promise<User|null>} ユーザーオブジェクト、または見つからない場合はnull。
   */
  async findForCreationCheck(email, username, tenantId) {
    return await User.findOne({ $or: [{ email }, { username, tenantId }] });
  }

  /**
   * 新しいユーザーを作成して保存します。
   * @param {object} userData - 新しいユーザーのデータ。
   * @returns {Promise<User>} 作成されたユーザーオブジェクト。
   */
  async create(userData) {
    const newUser = new User(userData);
    return await newUser.save();
  }

  /**
   * アクセス可能なテナントの中から、指定されたIDのユーザーを検索します（Mongooseの完全なオブジェクトを返す）。
   * @param {string} id - 検索するユーザーのID。
   * @param {string[]} accessibleTenantIds - アクセスが許可されているテナントIDの配列。
   * @returns {Promise<User|null>} 完全なユーザーオブジェクト、または見つからない場合はnull。
   */
  async findFullAccessibleUserById(id, accessibleTenantIds) {
    return await User.findOne({
      _id: id,
      tenantId: { $in: accessibleTenantIds }
    });
  }

  /**
   * IDでユーザーを削除します。
   * @param {string} id - 削除するユーザーのID。
   * @returns {Promise<any>} Mongooseの削除結果オブジェクト。
   */
  async deleteById(id) {
    return await User.findByIdAndDelete(id);
  }

  /**
   * IDでユーザーを検索します（Mongooseの完全なオブジェクトを返す）。
   * @param {string} id - 検索するユーザーのID。
   * @returns {Promise<User|null>} 完全なユーザーオブジェクト、または見つからない場合はnull。
   */
  async findById(id) {
    return await User.findById(id);
  }

  /**
   * ログイン成功時にフロントエンドに返すためのユーザー情報を取得します。
   * @param {string} id - 検索するユーザーのID。
   * @returns {Promise<User|null>} パスワードを除外し、テナント情報をpopulateしたユーザーオブジェクト。
   */
  async findUserForLoginResponse(id) {
    return await User.findById(id)
      .select('-password')
      .populate('tenantId', 'name parent');
  }
}

module.exports = UserRepository;