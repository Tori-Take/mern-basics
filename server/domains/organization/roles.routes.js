const express = require('express');
const router = express.Router();
const Role = require('./role.model');
const auth = require('../../core/middleware/auth');
const admin = require('../../core/middleware/admin');
const { getAccessibleTenantIds } = require('../../core/services/permissionService');
const tenantService = require('./services/tenant.service'); // ★ tenantServiceをインポート

/**
 * @route   GET /api/roles
 * @desc    テナントに属する全ロールを取得する
 * @access  Private (Admin)
 */
router.get('/', [auth, admin], async (req, res) => {
  try {
    // ★★★ ここからが新しいロジック ★★★
    // 1. 基準となるテナントIDを取得 (クエリパラメータ or 操作者の所属テナント)
    const targetTenantId = req.query.tenantId || req.user.tenantId;
    if (!targetTenantId) {
      return res.json([]); // 基準となるテナントがなければ空を返す
    }

    // 2. 基準テナントIDから、その組織のルートテナントIDを見つけ出す
    const rootTenantId = await tenantService.findOrganizationRoot(targetTenantId);

    // 3. ルートテナントIDに紐づくロールを検索して返す
    const roles = await Role.find({ tenantId: rootTenantId });
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
    // ★★★ ここからが新しいロジック ★★★
    // 1. 操作者の所属組織のルートテナントIDを見つけ出す
    const rootTenantId = await tenantService.findOrganizationRoot(req.user.tenantId);
    if (!rootTenantId) {
      return res.status(400).json({ message: '所属組織が見つからないため、ロールを作成できません。' });
    }

    // 2. その組織内で同じ名前のロールが存在しないかチェック
    const existingRole = await Role.findOne({ name, tenantId: rootTenantId });
    if (existingRole) {
      return res.status(400).json({ message: 'そのロール名は既に使用されています。' });
    }

    // 3. ルートテナントIDに紐づけて新しいロールを作成
    const newRole = new Role({ name, description, tenantId: rootTenantId });

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