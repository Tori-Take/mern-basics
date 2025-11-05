const mongoose = require('mongoose');
const Tenant = require('../../domains/organization/tenant.model');
const User = require('../../domains/identity/user.model');

/**
 * ログイン中の管理者がアクセス可能な全てのテナントIDのリストを取得する
 * @param {object} operator - 操作を実行している管理者ユーザーのオブジェクト (req.user)
 * @returns {Promise<Array<mongoose.Types.ObjectId>>} - アクセス可能なテナントIDの配列
 */
const getAccessibleTenantIds = async (operator) => {
  if (!operator) {
    return [];
  }

  // ★★★ Superuserの特別扱いロジックを追加 ★★★
  if (operator && operator.roles.includes('superuser')) {
    // もしSuperuserなら、全てのテナントIDを返す
    const allTenants = await Tenant.find({}).select('_id');
    const allTenantIds = allTenants.map(t => t._id);
    return allTenantIds;
  }
  // ★★★ ここまで ★★★

  const operatorTenantId = operator.tenantId;

  // Ensure tenantId is a valid ObjectId
  const tenantId = mongoose.Types.ObjectId.isValid(operatorTenantId) ? new mongoose.Types.ObjectId(operatorTenantId) : null;

  if (!tenantId) {
    return [];
  }

  const aggregationResult = await Tenant.aggregate([
    { $match: { _id: tenantId } },
    {
      $graphLookup: {
        from: 'tenants',
        startWith: '$_id',
        connectFromField: '_id',
        connectToField: 'parent',
        as: 'descendants'
      }
    }
  ]);

  const resultIds = aggregationResult[0] ? [aggregationResult[0]._id, ...aggregationResult[0].descendants.map(d => d._id)] : [];
  return resultIds;
};

/**
 * ★★★ 新しく追加 ★★★
 * 指定されたテナントIDが継承する全ての利用可能権限を取得します。
 * @param {string | mongoose.Types.ObjectId} tenantId - 権限を取得する対象のテナントID。
 * @returns {Promise<string[]>} 継承された権限キーの配列。
 */
async function getInheritedPermissionsForTenant(tenantId) {
  if (!tenantId) {
    return [];
  }

  const tenant = await Tenant.findById(tenantId).select('parent availablePermissions').lean();
  if (!tenant) {
    return [];
  }

  // 親部署から再帰的に権限を取得
  const parentPermissions = tenant.parent ? await getInheritedPermissionsForTenant(tenant.parent) : [];

  // Setを使って、親の権限と自身の権限をマージし、重複を除去する
  const mergedPermissions = new Set([...parentPermissions, ...(tenant.availablePermissions || [])]);
  return Array.from(mergedPermissions);
}

module.exports = {
  getAccessibleTenantIds,
  getInheritedPermissionsForTenant, // ★ エクスポートに追加
};