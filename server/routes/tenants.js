const router = require('express').Router();
const Tenant = require('../models/tenant.model');
const mongoose = require('mongoose'); // ★ Mongooseをインポート
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

/**
 * @route   GET /api/tenants
 * @desc    自身のテナントと、その直下の子テナントを取得する
 * @access  Private (Admin)
 */
router.get('/', [auth, admin], async (req, res) => {
  try {
    // 1. ログインユーザーが所属するテナントのIDを取得
    const userTenantId = req.user.tenantId;

    // 2. ログインユーザーのテナントから、その組織全体の階層を取得
    //    $graphLookupを使って、親方向と子方向の両方を検索します。
    const hierarchy = await Tenant.aggregate([
      // ステップA: ユーザーの所属テナントを起点に、親を遡ってルートを見つける
      { $graphLookup: {
          from: 'tenants',
          startWith: '$parent',
          connectFromField: 'parent',
          connectToField: '_id',
          as: 'ancestors'
      }},
      // ステップB: ログインユーザーのテナントに絞り込む
      { $match: { _id: userTenantId } },
      // ステップC: 見つけたルートテナント（または自身）を起点に、子孫をすべて見つける
      { $graphLookup: {
          from: 'tenants',
          startWith: { $ifNull: [ { $arrayElemAt: [ '$ancestors._id', -1 ] }, '$_id' ] }, // 親がいれば親から、いなければ自分から
          connectFromField: '_id',
          connectToField: 'parent',
          as: 'descendants'
      }},
      // ステップD: 取得した全テナントを一つの配列にまとめる
      { $project: { allTenants: { $setUnion: [ '$ancestors', '$descendants', ['$$ROOT'] ] } } },
      { $unwind: '$allTenants' },
      { $replaceRoot: { newRoot: '$allTenants' } },
    ]);

    // 3. populateで親の名前を付与
    const populatedHierarchy = await Tenant.populate(hierarchy, { path: 'parent', select: 'name' });

    res.json(populatedHierarchy);
  } catch (err) {
    console.error('【GET /api/tenants】API処理中にエラーが発生しました:', err);
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

// Note: PUT (更新) や DELETE (削除) のAPIもここに追加していくことができます。

module.exports = router;