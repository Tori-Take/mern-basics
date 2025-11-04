const asyncHandler = require('express-async-handler');
const Hiyari = require('./hiyari.model');
const tenantService = require('../organization/services/tenant.service'); // ★ tenant.serviceをインポート

/**
 * @desc    新しいヒヤリハットを登録する
 * @route   POST /api/hiyari
 * @access  Private
 */
const createHiyari = asyncHandler(async (req, res) => {
  // ★★★ STEP 4: tagsも受け取るように修正 ★★★
  const { incidentDate, location, details, category, tags } = req.body;

  if (!incidentDate || !details || !category) {
    res.status(400);
    throw new Error('発生日時、詳細、カテゴリは必須項目です。');
  }

  // ★★★ STEP 4: userとtenantの情報を追加 ★★★
  const hiyari = await Hiyari.create({
    user: req.user.id, // ログインユーザーのID
    tenant: req.user.tenantId, // ログインユーザーの所属部署ID
    incidentDate,
    location,
    details,
    category,
    tags,
  });

  res.status(201).json(hiyari);
});

/**
 * @desc    ログインユーザーが所属する【組織】のヒヤリハットを取得する
 * @route   GET /api/hiyari
 * @access  Private
 */
const getHiyaris = asyncHandler(async (req, res) => {
  // ★★★ 組織全体の投稿を取得するロジック ★★★
  // 1. ログインユーザーの所属部署IDを取得
  const userTenantId = req.user.tenantId;

  // 2. 所属部署から組織のルート（最上位）を見つける
  const rootTenantId = await tenantService.findOrganizationRoot(userTenantId);
  if (!rootTenantId) {
    return res.status(200).json([]); // 組織が見つからなければ空の配列を返す
  }

  // 3. 組織配下の全部署IDを取得する
  // ★★★ 修正: 正しい関数名を呼び出し、返されたオブジェクトからIDを抽出する ★★★
  const hierarchyTenants = await tenantService.getTenantHierarchy(rootTenantId);
  const allTenantIdsInOrg = [rootTenantId, ...hierarchyTenants.map(t => t._id)];

  // 4. 組織全体のヒヤリハットを検索し、投稿者名をpopulateする
  const hiyaris = await Hiyari.find({ tenant: { $in: allTenantIdsInOrg } })
    .populate('user', 'username') // 投稿者のユーザー名も取得
    .sort({ incidentDate: -1 }); // 発生日が新しい順にソート

  res.status(200).json(hiyaris);
});

/**
 * @desc    特定のヒヤリハットを更新する
 * @route   PUT /api/hiyari/:id
 * @access  Private
 */
const updateHiyari = asyncHandler(async (req, res) => {
  const hiyari = await Hiyari.findById(req.params.id);

  if (!hiyari) {
    res.status(404);
    throw new Error('ヒヤリハットが見つかりません。');
  }

  // 権限チェック: 投稿者本人か、管理者のみが更新可能
  const isCreator = hiyari.user.toString() === req.user.id;
  const isAdmin = req.user.roles.includes('admin');

  if (!isCreator && !isAdmin) {
    res.status(403);
    throw new Error('この操作を実行する権限がありません。');
  }

  const updatedHiyari = await Hiyari.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // 更新後のドキュメントを返す
  }).populate('user', 'username');

  res.status(200).json(updatedHiyari);
});

/**
 * @desc    特定のヒヤリハットを削除する
 * @route   DELETE /api/hiyari/:id
 * @access  Private
 */
const deleteHiyari = asyncHandler(async (req, res) => {
  const hiyari = await Hiyari.findById(req.params.id);

  if (!hiyari) {
    res.status(404);
    throw new Error('ヒヤリハットが見つかりません。');
  }

  // 権限チェック: 投稿者本人か、管理者のみが削除可能
  const isCreator = hiyari.user.toString() === req.user.id;
  const isAdmin = req.user.roles.includes('admin');

  if (!isCreator && !isAdmin) {
    res.status(403);
    throw new Error('この操作を実行する権限がありません。');
  }

  await hiyari.deleteOne();

  res.status(200).json({ id: req.params.id });
});

module.exports = {
  createHiyari,
  getHiyaris,
  updateHiyari,
  deleteHiyari,
};