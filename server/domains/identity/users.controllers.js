const User = require('./user.model');
const Tenant = require('../organization/tenant.model');
const bcrypt = require('bcryptjs');
const Role = require('../organization/role.model');
const jwt = require('jsonwebtoken');
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
      console.error('Registration Error:', err.message);
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
   * @route GET /api/auth
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
      const { email } = req.body;
      const userObject = await userService.updateUserProfile(req.user.id, email);

      // フロントエンド互換性のための整形
      userObject.name = userObject.username;
      delete userObject.password;

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
      const users = await userService.getAssignableUsers(req.user.tenantId?._id);
      res.json(users);
    } catch (err) {
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
      const user = await userService.getAccessibleUserById(req.params.id, req.user.tenantId?._id);
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
      const updatedUser = await userService.updateUserByAdmin(req.params.id, req.body, req.user.tenantId?._id);
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
      const { username, email, password } = req.body; // 簡単なバリデーションのため
      if (!username || !email || !password) {
        return res.status(400).json({ message: 'ユーザー名、メールアドレス、パスワードは必須です。' });
      }
      const userObject = await userService.createUserByAdmin(req.body, req.user.tenantId);
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

module.exports = UserController;