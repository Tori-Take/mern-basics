const Tenant = require('../organization/tenant.model');
const User = require('../identity/user.model');
// 他の関連モデルも必要に応じてインポートします（例: Todo, Roleなど）

/**
 * システムに存在する全てのテナントを取得します。
 * @returns {Promise<Array>} テナントの配列
 */
const getAllTenants = async () => {
  return Tenant.find().sort({ createdAt: 'desc' });
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
