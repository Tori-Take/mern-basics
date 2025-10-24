const express = require('express');
const router = express.Router();
const auth = require('../../core/middleware/auth');
const admin = require('../../core/middleware/admin');
const UserController = require('./users.controllers');

/**
 * @route   POST /api/users/register
 * @desc    新しいテナントと、そのテナントの最初の管理者ユーザーを登録する
 * @access  Public
 */
router.post('/register', UserController.register);

// @route   POST /api/users/login
// @desc    ユーザーを認証し、トークンを取得する
// @access  Public
router.post('/login', UserController.login);

// @route   GET /api/auth
// @desc    トークンからユーザー情報を取得する
// @access  Private
router.get('/auth', auth, UserController.getAuthUser);

/**
 * @route   PUT /api/users/profile
 * @desc    ログイン中のユーザーが自身のプロフィール（ユーザー名、メール）を更新する
 * @access  Private
 */
router.put('/profile', auth, UserController.updateProfile);

/**
 * @route   PUT /api/users/profile/password
 * @desc    ログイン中のユーザーが自身のパスワードを更新する
 * @access  Private
 */
router.put('/profile/password', auth, UserController.updatePassword);

/**
 * @route   GET /api/users/assignable
 * @desc    タスクを割り当て可能なユーザー（自部署とその配下）のリストを取得する
 * @access  Private
 */
router.get('/assignable', auth, UserController.getAssignableUsers);

// @route   GET /api/users
// @desc    全ユーザーのリストを取得する (管理者のみ)
// @access  Private/Admin
router.get('/', [auth, admin], UserController.getAllUsers);

// @route   GET /api/users/:id
// @desc    特定のユーザー情報を取得する (管理者のみ)
// @access  Private/Admin
router.get('/:id', [auth, admin], UserController.getUserById);

// @route   PUT /api/users/:id
// @desc    ユーザー情報を更新する (管理者のみ)
// @access  Private/Admin
router.put('/:id', [auth, admin], UserController.updateUser);

// @route   POST /api/users
// @desc    管理者が新しいユーザーを作成する
// @access  Private/Admin
router.post('/', [auth, admin], UserController.createUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    ユーザーを削除する (管理者のみ)
 * @access  Private/Admin
 */
router.delete('/:id', [auth, admin], UserController.deleteUser);

// @route   POST /api/users/:id/force-reset
// @desc    管理者がユーザーのパスワードリセットを強制する
// @access  Private/Admin
router.post('/:id/force-reset', [auth, admin], UserController.forcePasswordReset);

// @route   POST /api/users/force-reset-password
// @desc    ユーザーが強制的にパスワードを再設定する
// @access  Private (Logged-in user)
router.post('/force-reset-password', auth, UserController.userForceResetPassword);

module.exports = router;
