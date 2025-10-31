const router = require('express').Router();
const Tenant = require('./tenant.model');
const User = require('../../domains/identity/user.model'); // ★ Userモデルをインポート
const mongoose = require('mongoose'); // ★ Mongooseをインポート
const auth = require('../../core/middleware/auth');
const admin = require('../../core/middleware/admin');
const { getAccessibleTenantIds } = require('../../core/services/permissionService');
const TenantController = require('./tenants.controllers'); // ★ 新しくインポート
const tenantService = require('./services/tenant.service'); // ★ 新しくインポート

/**
 * @route   GET /api/tenants
 * @desc    自身のテナントと、その直下の子テナントを取得する
 * @access  Private (Admin)
 */
router.get('/', [auth, admin], async (req, res) => {
  try {
    // 1. ユーザーが所属する組織の最上位のルートIDを見つける
    const rootId = await tenantService.findOrganizationRoot(req.user.tenantId);

    // 2. 組織全体の階層データを取得
    const allTenantsInHierarchy = await tenantService.getTenantHierarchy(rootId);

    if (!allTenantsInHierarchy || allTenantsInHierarchy.length === 0) {
      return res.json([]);
    }

    // 3. ログインユーザーがアクセス可能なテナントIDリストを取得
    const accessibleTenantIds = await getAccessibleTenantIds(req.user.tenantId);

    // 4. ツリー構造に変換（アクセス可能フラグを付与）
    const tenantTree = tenantService.buildTenantTree(allTenantsInHierarchy, accessibleTenantIds);

    // 5. ツリーを階層順のフラットなリストに戻すためのヘルパー関数
    const flattenTreeWithDepth = (nodes, depth = 0) => {
      let list = [];
      nodes.forEach(node => {
        const { children, ...restOfNode } = node; // childrenは再帰で使うので除外
        list.push({ ...restOfNode, depth });
        list = list.concat(flattenTreeWithDepth(node.children, depth + 1));
      });
      return list;
    };

    const tenants = flattenTreeWithDepth(tenantTree);

    res.json(tenants);

  } catch (err) {
    console.error('【GET /api/tenants】 An error occurred during API processing:', err);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

/**
 * @route   GET /api/tenants/all
 * @desc    （CSV出力用）アクセス可能な全テナントをフラットなリストで取得
 * @access  Private (Admin)
 */
router.get('/all', [auth, admin], async (req, res) => {
  try {
    const tenants = await Tenant.find({}).select('name _id');
    res.json(tenants);
  } catch (err) {
    res.status(500).send('サーバーエラーが発生しました。');
  }
});
/**
 * @route   GET /api/tenants/tree
 * @desc    自身のテナント階層をツリー構造で取得する
 * @access  Private (Admin)
 */
router.get('/tree', [auth, admin], TenantController.getTenantTree);

/**
 * @route   GET /api/tenants/:id
 * @desc    特定のテナント（部署）の詳細情報を取得する
 * @access  Private (Admin)
 */
router.get('/:id', [auth, admin], async (req, res) => {
  try {
    const tenantId = req.params.id;

    // --- セキュリティ強化 ---
    // 1. ログイン管理者がアクセス可能なテナントIDリストを取得
    const accessibleTenantIds = await getAccessibleTenantIds(req.user.tenantId?._id);
    // 2. アクセスしようとしているテナントが、そのリストに含まれているか検証
    const isAllowed = accessibleTenantIds.some(id => id.equals(tenantId));
    if (!isAllowed) {
      return res.status(403).json({ message: 'この部署にアクセスする権限がありません。' });
    }

    // 1. テナント自体の情報を取得し、親の名前をpopulateする
    const tenant = await Tenant.findById(tenantId).populate('parent', 'name');

    if (!tenant) {
      return res.status(404).json({ message: '部署が見つかりません。' });
    }

    // 2. このテナントを親に持つ子テナント（サブ部署）の一覧を取得する
    const children = await Tenant.find({ parent: tenantId }).select('name _id');

    // 3. このテナントに所属するユーザーの一覧を取得する
    const users = await User.find({ tenantId: tenantId }).select('username email roles status');

    // 4. レスポンスとして、テナント情報、子テナント一覧、所属ユーザー一覧を返す
    res.json({
      ...tenant.toObject(), // Mongooseドキュメントをプレーンなオブジェクトに変換
      children,
      users,
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

/**
 * @route   POST /api/tenants
 * @desc    新しい子テナント（部署など）を作成する
 * @access  Private (Admin)
 */
router.post('/', [auth, admin], async (req, res) => {
  const { name, parentId } = req.body; // ★ parentIdを受け取る

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'テナント名は必須です。' });
  }

  try {
    // ★ parentIdが指定されていればそれを使い、なければログインユーザーのテナントを親とする
    const parentTenantId = parentId || req.user.tenantId;

    const newTenant = new Tenant({
      name: name.trim(),
      parent: parentTenantId,
    });

    const tenant = await newTenant.save();
    res.status(201).json(tenant);
  } catch (err) {
    // データ品質: 重複エラー(E11000)のハンドリング
    if (err.code === 11000) {
      return res.status(400).json({ message: 'そのテナント名は既に使用されています。' });
    }
    console.error(err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

/**
 * @route   PUT /api/tenants/:id
 * @desc    テナント（部署）名を更新する
 * @access  Private (Admin)
 */
router.put('/:id', [auth, admin], async (req, res) => {
  const { name } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'テナント名は必須です。' });
  }

  try {
    const tenantIdToUpdate = req.params.id;

    // --- セキュリティ強化 ---
    const accessibleTenantIds = await getAccessibleTenantIds(req.user.tenantId?._id);
    const isAllowed = accessibleTenantIds.some(id => id.equals(tenantIdToUpdate));
    if (!isAllowed) {
      return res.status(403).json({ message: 'この部署を編集する権限がありません。' });
    }

    const tenant = await Tenant.findById(tenantIdToUpdate);
    if (!tenant) return res.status(404).json({ message: 'テナントが見つかりません。' });


    tenant.name = name.trim();
    await tenant.save();

    res.json(tenant);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'そのテナント名は既に使用されています。' });
    }
    console.error(err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

/**
 * @route   DELETE /api/tenants/:id
 * @desc    テナント（部署）を削除する
 * @access  Private (Admin)
 */
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const tenantIdToDelete = req.params.id;

    // --- セキュリティ強化 ---
    const accessibleTenantIds = await getAccessibleTenantIds(req.user.tenantId?._id);
    const isAllowed = accessibleTenantIds.some(id => id.equals(tenantIdToDelete));
    if (!isAllowed) {
      return res.status(403).json({ message: 'この部署を削除する権限がありません。' });
    }


    // 安全装置1: 子テナント（サブ部署）が存在する場合は削除させない
    const childCount = await Tenant.countDocuments({ parent: tenantIdToDelete });
    if (childCount > 0) {
      return res.status(400).json({ message: `この部署には ${childCount} 個のサブ部署が存在するため、削除できません。` });
    }

    // 安全装置2: ユーザーが所属している場合は削除させない
    const userCount = await User.countDocuments({ tenantId: tenantIdToDelete });
    if (userCount > 0) {
      // --- デバッグ用ログ ---
      // どのユーザーが所属しているために削除できないのかを確認する
      const usersInTenant = await User.find({ tenantId: tenantIdToDelete }).select('username email');
      console.log(`【DELETE /api/tenants】削除ブロック: テナント ${tenantIdToDelete} には以下のユーザーが所属しています:`, usersInTenant);
      // --- デバッグ用ログここまで ---
      return res.status(400).json({ message: `この部署には ${userCount} 人のユーザーが所属しているため、削除できません。` });
    }

    await Tenant.findByIdAndDelete(tenantIdToDelete);

    res.json({ message: 'テナントが正常に削除されました。' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

module.exports = router;
