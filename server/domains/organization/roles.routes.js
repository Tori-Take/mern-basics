const express = require('express');
const router = express.Router();
const Role = require('./role.model');
const auth = require('../../core/middleware/auth');
const admin = require('../../core/middleware/admin');
const { getAccessibleTenantIds } = require('../../core/services/permissionService');

/**
 * @route   GET /api/roles
 * @desc    テナントに属する全ロールを取得する
 * @access  Private (Admin)
 */
router.get('/', [auth, admin], async (req, res) => {
  try {
    // 1. クエリパラメータからtenantIdを取得。なければ操作者自身のtenantIdを使用
    const targetTenantId = req.query.tenantId || req.user.tenantId;

    // 2. Superuserはどのテナントのロールでも取得できる。
    //    Adminは自分がアクセス可能なテナントのロールのみ取得できる。
    const accessibleTenantIds = await getAccessibleTenantIds(req.user);
    // targetTenantIdがObjectIdでない可能性を考慮し、toString()で比較
    if (!accessibleTenantIds.some(id => id.toString() === targetTenantId.toString())) {
      return res.status(403).json({ message: 'この組織のロールにアクセスする権限がありません。' });
    }

    // 3. 対象テナントのロールを検索して返す
    const roles = await Role.find({ tenantId: targetTenantId });
    res.json(roles);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

/**
 * @route   POST /api/roles
 * @desc    新しいロールを作成する
 * @access  Private (Admin)
 */
router.post('/', [auth, admin], async (req, res) => {
  const { name, description } = req.body;

  // 基本的なバリデーション
  if (!name) {
    return res.status(400).json({ message: 'ロール名は必須です。' });
  }

  try {
    // 同じテナント内で同じ名前のロールが存在しないかチェック
    const existingRole = await Role.findOne({ name, tenantId: req.user.tenantId });
    if (existingRole) {
      return res.status(400).json({ message: 'そのロール名は既に使用されています。' });
    }

    const newRole = new Role({
      name,
      description,
      tenantId: req.user.tenantId, // ロールは操作者のテナントに紐づける
    });

    const role = await newRole.save();
    res.status(201).json(role);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

/**
 * @route   PUT /api/roles/:id
 * @desc    ロールを更新する
 * @access  Private (Admin)
 */
router.put('/:id', [auth, admin], async (req, res) => {
  const { name, description } = req.body;

  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ message: 'ロールが見つかりません。' });
    }

    // 権限チェック: 自分のテナントのロールしか編集できない
    if (role.tenantId.toString() !== req.user.tenantId.toString()) {
      return res.status(403).json({ message: 'このロールを編集する権限がありません。' });
    }

    role.name = name || role.name;
    role.description = description || role.description;

    const updatedRole = await role.save();
    res.json(updatedRole);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

/**
 * @route   DELETE /api/roles/:id
 * @desc    ロールを削除する
 * @access  Private (Admin)
 */
router.delete('/:id', [auth, admin], async (req, res) => {
  // この機能はまだ実装されていません
  res.status(501).json({ message: 'この機能はまだ実装されていません。' });
});

module.exports = router;