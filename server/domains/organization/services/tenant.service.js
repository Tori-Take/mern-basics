const Tenant = require('../tenant.model');
const mongoose = require('mongoose');

/**
 * 指定されたテナントIDとその全ての子孫テナントを取得します。
 * @param {string|mongoose.Types.ObjectId} tenantId - 階層のルートとなるテナントのID
 * @returns {Promise<Array>} - 指定されたテナントとその子孫テナントのフラットな配列
 */
const getTenantHierarchy = async (tenantId) => {
  // tenantIdがnullまたは未定義の場合、空の配列を返す
  if (!tenantId) {
    return [];
  }
  const hierarchy = await Tenant.aggregate([
    // 1. 開始点となるテナントを特定
    { $match: { _id: new mongoose.Types.ObjectId(tenantId) } },
    // 2. $graphLookupで再帰的に子孫を検索
    {
      $graphLookup: {
        from: 'tenants',          // 同じ'tenants'コレクションを検索
        startWith: '$_id',        // 開始テナントのIDからスタート
        connectFromField: '_id',  // 子テナントの'parent'フィールドと接続するキー
        connectToField: 'parent', // 親テナントの'_id'フィールドと接続されるキー
        as: 'descendants',        // 見つかった子孫を'descendants'という配列に格納
        depthField: 'depth'       // 階層の深さを'depth'フィールドに格納
      }
    },
    // 3. 自身と子孫を一つの配列にまとめる
    {
      $project: {
        allTenants: {
          $concatArrays: [
            // Mongooseドキュメントの全フィールドを保持するために$$ROOTを使用
            ['$$ROOT'],
            '$descendants'
          ]
        }
      }
    },
    // 4. 配列を展開してフラットなリストにする
    { $unwind: '$allTenants' },
    // 5. 展開された各テナントのドキュメントを新しいルートにし、IDをObjectIdに変換
    { $replaceRoot: { newRoot: '$allTenants' } },
    // 6. 各テナントに所属するユーザー数をカウントするために$lookupを実行
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: 'tenantId',
        as: 'users'
      }
    },
    // 7. userCountフィールドを追加し、不要なusers配列を削除
    {
      $addFields: {
        userCount: { $size: '$users' }
      }
    },
    {
      $project: { users: 0, descendants: 0 } // usersと一時的なdescendants配列は不要なので除外
    }
  ]);
  return hierarchy;
};

/**
 * フラットなテナントのリストをネストされたツリー構造に変換します。
 * @param {Array} tenants - テナントオブジェクトのフラットな配列
 * @returns {Array} - ネストされたツリー構造のテナントオブジェクトの配列
 */
const buildTenantTree = (tenants, accessibleTenantIds = null) => {
  const tenantMap = {};
  const tree = [];
  const accessibleSet = accessibleTenantIds
    ? new Set(accessibleTenantIds.map(id => id.toString()))
    : null;

  // 1. 全てのテナントをマップに格納し、childrenプロパティを初期化
  tenants.forEach(tenant => {
    const isAccessible = accessibleSet ? accessibleSet.has(tenant._id.toString()) : true;
    const tenantObj = { ...tenant, children: [], isAccessible };
    tenantMap[tenant._id.toString()] = tenantObj;
  });

  // 2. 各テナントをループし、親のchildren配列に追加
  Object.values(tenantMap).forEach(tenant => {
    if (tenant.parent) {
      const parentId = tenant.parent.toString();
      if (tenantMap[parentId]) {
        tenantMap[parentId].children.push(tenant);
      } else {
        // 親がリスト内に存在しない場合（＝階層のルート）、ルートレベルとして扱う
        tree.push(tenant);
      }
    } else {
      // 親がいないテナントはルートレベル
      tree.push(tenant);
    }
  });

  return tree;
};

/**
 * 指定されたテナントIDから組織のルートテナントIDを見つけます。
 * @param {string|mongoose.Types.ObjectId} tenantId - 開始点となるテナントのID
 * @returns {Promise<mongoose.Types.ObjectId|null>} - ルートテナントのID、または見つからない場合はnull
 */
const findOrganizationRoot = async (tenantId) => {
  let currentTenant = await Tenant.findById(tenantId);
  if (!currentTenant) {
    return null;
  }

  // 親をたどり、parentがnullになるまでループする
  while (currentTenant.parent) {
    currentTenant = await Tenant.findById(currentTenant.parent);
    if (!currentTenant) {
      // 途中で親が見つからなくなることは通常ないが、念のため
      return null;
    }
  }
  return currentTenant._id;
};

module.exports = {
  getTenantHierarchy,
  buildTenantTree,
  findOrganizationRoot,
};
