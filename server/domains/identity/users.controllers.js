const User = require('./user.model');
const Tenant = require('../organization/tenant.model');
const bcrypt = require('bcryptjs');
const Role = require('../organization/role.model');
const jwt = require('jsonwebtoken');
const { getAccessibleTenantIds } = require('../../core/services/permissionService');

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
      const { username, email, password, tenantName } = req.body;

      // --- 入力値のバリデーション ---
      if (!username || !email || !password || !tenantName) {
        return res.status(400).json({ message: 'すべての必須項目（組織名, ユーザー名, メールアドレス, パスワード）を入力してください。' });
      }

      // --- テナント名とメールアドレスの重複チェック ---
      const existingTenant = await Tenant.findOne({ name: tenantName });
      if (existingTenant) {
        return res.status(400).json({ message: 'その組織名は既に使用されています。' });
      }
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'このメールアドレスは既に使用されています。' });
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
      const newUser = new User({
        tenantId: newTenant._id,
        username,
        email,
        password: hashedPassword,
        roles: ['user', 'admin'],
      });

      await newUser.save();

      res.status(201).json({ message: 'ユーザー登録が成功しました。' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('サーバーエラーが発生しました。');
    }
  }

  /**
   * @description Authenticate user and get token
   * @route POST /api/users/login
   * @access Public
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'メールアドレスとパスワードを入力してください。' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'ユーザー名またはパスワードが無効です。' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'ユーザー名またはパスワードが無効です。' });
      }

      if (user.status !== 'active') {
        return res.status(403).json({ message: 'このアカウントは現在利用できません。' });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, async (err, token) => {
        if (err) throw err;

        if (user.forcePasswordReset) {
          return res.json({ token, forceReset: true });
        }

        const userToReturn = await User.findById(user.id).select('-password').populate('tenantId', 'name parent');
        res.json({ token, user: userToReturn });
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('サーバーエラーが発生しました。');
    }
  }

  /**
   * @description Get user from token
   * @route GET /api/auth
   * @access Private
   */
  static async getAuthUser(req, res) {
    try {
      // authミドルウェアでreq.userにIDがセットされている
      const user = await User.findById(req.user.id)
        .select('-password')
        .populate('tenantId', 'name parent'); // ★ ユーザーの所属テナント情報（名前と親）を取得

      if (!user) {
        return res.status(404).json({ message: 'ユーザーが見つかりません。' });
      }

      // Mongooseドキュメントをプレーンなオブジェクトに変換
      const userObject = user.toObject();

      // ★ 最上位の管理者かどうかを判定するフラグを追加
      // 'admin'ロールを持ち、かつ所属テナントに親(parent)がいない場合にtrue
      userObject.isTopLevelAdmin = user.roles.includes('admin') && user.tenantId?.parent === null;

      // ★ フロントエンドの互換性のために name プロパティを追加
      userObject.name = userObject.username;

      res.json(userObject);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('サーバーエラー');
    }
  }

  /**
   * @description Update logged-in user's profile (email)
   * @route PUT /api/users/profile
   * @access Private
   */
  static async updateProfile(req, res) {
    const { email, username } = req.body; // usernameも受け取るが、現在はemailのみを処理対象とする

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'ユーザーが見つかりません。' });
      }

      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: 'このメールアドレスは既に使用されています。' });
        }
        user.email = email;
      }

      const updatedUser = await user.save();
      const userObject = updatedUser.toObject();

      userObject.name = userObject.username;
      delete userObject.password;

      res.json(userObject);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('サーバーエラー');
    }
  }

  /**
   * @description Update logged-in user's password
   * @route PUT /api/users/profile/password
   * @access Private
   */
  static async updatePassword(req, res) {
    const { currentPassword, newPassword } = req.body;

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'ユーザーが見つかりません。' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: '現在のパスワードが正しくありません。' });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      res.json({ message: 'パスワードが正常に更新されました。' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('サーバーエラー');
    }
  }

  /**
   * @description Get a list of users to whom tasks can be assigned (own department and below)
   * @route GET /api/users/assignable
   * @access Private
   */
  static async getAssignableUsers(req, res) {
    try {
      const accessibleTenantIds = await getAccessibleTenantIds(req.user.tenantId?._id);
      const users = await User.find({ tenantId: { $in: accessibleTenantIds } })
        .select('username tenantId')
        .populate('tenantId', 'name')
        .sort({ username: 1 });
      res.json(users);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('サーバーエラーが発生しました。');
    }
  }

  /**
   * @description Get all users (for admins)
   * @route GET /api/users
   * @access Private/Admin
   */
  static async getAllUsers(req, res) {
    try {
      const accessibleTenantIds = await getAccessibleTenantIds(req.user.tenantId?._id);
      if (accessibleTenantIds.length === 0) {
        return res.json([]);
      }
      const users = await User.find({ tenantId: { $in: accessibleTenantIds } })
        .select('-password')
        .sort({ createdAt: -1 });
      res.json(users);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('サーバーエラーが発生しました。');
    }
  }

  /**
   * @description Get a specific user by ID (for admins)
   * @route GET /api/users/:id
   * @access Private/Admin
   */
  static async getUserById(req, res) {
    try {
      const accessibleTenantIds = await getAccessibleTenantIds(req.user.tenantId?._id);
      const user = await User.findOne({
        _id: req.params.id,
        tenantId: { $in: accessibleTenantIds }
      }).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'ユーザーが見つかりません。' });
      }
      res.json(user);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'ユーザーが見つかりません。' });
      }
      res.status(500).send('サーバーエラーが発生しました。');
    }
  }

  /**
   * @description Update user info (for admins)
   * @route PUT /api/users/:id
   * @access Private/Admin
   */
  static async updateUser(req, res) {
    try {
      const { username, email, roles, status, tenantId } = req.body;
      const accessibleTenantIds = await getAccessibleTenantIds(req.user.tenantId?._id);
      const user = await User.findOne({
        _id: req.params.id,
        tenantId: { $in: accessibleTenantIds }
      });
      if (!user) {
        return res.status(404).json({ message: 'ユーザーが見つかりません。' });
      }

      if (email && email !== user.email) {
        const existingEmail = await User.findOne({ email: email });
        if (existingEmail) {
          return res.status(400).json({ message: 'このメールアドレスは既に使用されています。' });
        }
        user.email = email;
      }

      if (username && username !== user.username) {
        const existingUsername = await User.findOne({ username: username, tenantId: user.tenantId, _id: { $ne: user._id } });
        if (existingUsername) {
          return res.status(400).json({ message: 'このユーザー名は既に使用されています。' });
        }
        user.username = username;
      }

      if (status) user.status = status;
      if (tenantId) user.tenantId = tenantId;
      if (roles) user.roles = roles;

      const updatedUser = await user.save();
      res.json(updatedUser);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('サーバーエラーが発生しました。');
    }
  }

  /**
   * @description Create a new user (for admins)
   * @route POST /api/users
   * @access Private/Admin
   */
  static async createUser(req, res) {
    try {
      const { username, email, password, roles, status } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: 'ユーザー名、メールアドレス、パスワードは必須です。' });
      }

      const existingUser = await User.findOne({ $or: [{ email }, { username, tenantId: req.user.tenantId }] });
      if (existingUser) {
        return res.status(400).json({ message: 'そのユーザー名またはメールアドレスは既に使用されています。' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const finalRoles = roles ? [...new Set(['user', ...roles])] : ['user'];

      const newUser = new User({
        tenantId: req.user.tenantId,
        username,
        email,
        password: hashedPassword,
        roles: finalRoles,
        status: status || 'active',
      });
      const savedUser = await newUser.save();

      const userObject = savedUser.toObject();
      delete userObject.password;
      res.status(201).json(userObject);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('サーバーエラーが発生しました。');
    }
  }

  /**
   * @description Delete a user (for admins)
   * @route DELETE /api/users/:id
   * @access Private/Admin
   */
  static async deleteUser(req, res) {
    try {
      const userIdToDelete = req.params.id;
      const accessibleTenantIds = await getAccessibleTenantIds(req.user.tenantId?._id);
      const userToDelete = await User.findOne({
        _id: userIdToDelete,
        tenantId: { $in: accessibleTenantIds }
      });

      if (!userToDelete) {
        return res.status(404).json({ message: 'ユーザーが見つからないか、削除する権限がありません。' });
      }

      if (userToDelete.id === req.user.id) {
        return res.status(400).json({ message: '自分自身のアカウントは削除できません。' });
      }

      await User.findByIdAndDelete(userIdToDelete);
      res.json({ message: 'ユーザーが正常に削除されました。' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('サーバーエラーが発生しました。');
    }
  }

  /**
   * @description Force password reset for a user (for admins)
   * @route POST /api/users/:id/force-reset
   * @access Private/Admin
   */
  static async forcePasswordReset(req, res) {
    const { temporaryPassword } = req.body;

    if (!temporaryPassword || temporaryPassword.length < 6) {
      return res.status(400).json({ message: '6文字以上の一時パスワードを指定してください。' });
    }

    try {
      // 権限チェック：自分のテナント配下のユーザーか確認
      const accessibleTenantIds = await getAccessibleTenantIds(req.user.tenantId?._id);
      const user = await User.findOne({ _id: req.params.id, tenantId: { $in: accessibleTenantIds } });
      if (!user) {
        return res.status(404).json({ message: '対象のユーザーが見つからないか、操作する権限がありません。' });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(temporaryPassword, salt);
      user.forcePasswordReset = true;
      await user.save();

      res.json({ message: `${user.username} のパスワードが一時パスワードに更新され、リセット待機状態に設定されました。` });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('サーバーエラーが発生しました。');
    }
  }

  /**
   * @description User resets their own forced password
   * @route POST /api/users/force-reset-password
   * @access Private
   */
  static async userForceResetPassword(req, res) {
    try {
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'パスワードは6文字以上で入力してください。' });
      }

      const user = await User.findById(req.user.id);
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      user.forcePasswordReset = false;
      await user.save();

      res.json({ message: 'パスワードが正常に更新されました。新しいパスワードで再度ログインしてください。' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('サーバーエラーが発生しました。');
    }
  }
}

module.exports = UserController;