const mongoose = require('mongoose');
const Tenant = require('../../domains/organization/tenant.model');
const User = require('../../domains/identity/user.model');

/**
 * ログイン中の管理者がアクセス可能な全てのテナントIDのリストを取得する
 * @param {object} operator - 操作を実行している管理者ユーザーのオブジェクト (req.user)
 * @returns {Promise<Array<mongoose.Types.ObjectId>>} - アクセス可能なテナントIDの配列
 */
const getAccessibleTenantIds = async (operator) => {
  console.log('--- [permissionService] getAccessibleTenantIds Called ---');
  if (!operator) {
    console.log('[perm] 1. Operator is null. Returning empty array.');
    return [];
  }
  console.log('[perm] 1. Operator:', { id: operator.id, roles: operator.roles, tenantId: operator.tenantId?.toString() });

  // ★★★ Superuserの特別扱いロジックを追加 ★★★
  if (operator && operator.roles.includes('superuser')) {
    // もしSuperuserなら、全てのテナントIDを返す
    console.log('[perm] 2. Operator is Superuser. Fetching all tenants.');
    const allTenants = await Tenant.find({}).select('_id');
    const allTenantIds = allTenants.map(t => t._id);
    console.log('[perm] 3. Superuser can access:', allTenantIds.map(id => id.toString()));
    return allTenantIds;
  }
  // ★★★ ここまで ★★★

  const operatorTenantId = operator.tenantId;
  console.log('[perm] 2. Operator Tenant ID:', operatorTenantId?.toString());

  // Ensure tenantId is a valid ObjectId
  const tenantId = mongoose.Types.ObjectId.isValid(operatorTenantId) ? new mongoose.Types.ObjectId(operatorTenantId) : null;

  if (!tenantId) {
    console.log('[perm] 3. Operator Tenant ID is invalid or null. Returning empty array.');
    return [];
  }
  console.log('[perm] 3. Performing aggregation to find descendants...');

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
  console.log('[perm] 4. Aggregation result (accessible IDs):', resultIds.map(id => id.toString()));
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