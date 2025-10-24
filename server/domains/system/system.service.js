const Tenant = require('../organization/tenant.model');
const User = require('../identity/user.model');
const tenantService = require('../organization/services/tenant.service');
// 他の関連モデルも必要に応じてインポートします（例: Todo, Roleなど）

/**
 * システムに存在する全てのテナントを取得します。
 * @returns {Promise<Array>} テナントの配列
 */
const getAllTenants = async () => {
  // 1. 最上位の組織（ルートテナント）のみを取得
  const rootTenants = await Tenant.find({ parent: null });

  // 2. 各ルート組織について、配下の全ユーザー数を計算
  const tenantsWithTotalUserCount = await Promise.all(rootTenants.map(async (rootTenant) => {
    // 2a. 組織の全階層を取得
    const hierarchy = await tenantService.getTenantHierarchy(rootTenant._id);
    const tenantIdsInHierarchy = hierarchy.map(t => t._id);

    // 2b. 階層に含まれる全テナントIDに所属するユーザーの総数をカウント
    const totalUserCount = await User.countDocuments({ tenantId: { $in: tenantIdsInHierarchy } });

    return { ...rootTenant.toObject(), userCount: totalUserCount };
  }));

  return tenantsWithTotalUserCount;
};

/**
 * 指定されたテナントIDに関連する全てのデータを削除します（カスケード削除）。
 * @param {string} tenantId - 削除するテナントのID
 */
const deleteTenantAndAssociatedData = async (tenantId) => {
  // トランザクションを利用して、一連の削除処理の原子性を保証することも可能です

  // 1. 関連するユーザーを削除
  await User.deleteMany({ tenantId: tenantId });

  // 2. テナント自体を削除
  await Tenant.findByIdAndDelete(tenantId);
};

module.exports = {
  getAllTenants,
  deleteTenantAndAssociatedData,
};
