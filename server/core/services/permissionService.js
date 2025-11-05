const mongoose = require('mongoose');
const Tenant = require('../../domains/organization/tenant.model');
const tenantService = require('../../domains/organization/services/tenant.service'); // ★ tenantServiceをインポート
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

  // ★★★ ここからが新しいTenantSuperuserのロジック ★★★
  // 1. 操作者が所属する組織のルートテナントIDを見つけ出す
  const rootTenantId = await tenantService.findOrganizationRoot(operator.tenantId);

  if (!rootTenantId) {
    // ルートが見つからない = 組織に正しく所属していない
    return [];
  }

  // 2. ルートテナント配下の全てのテナント(部署)を取得する
  // getTenantHierarchyはフラットな配列を返すように修正済みと仮定
  const allTenantsInOrg = await tenantService.getTenantHierarchy(rootTenantId);

  // 3. 取得したテナントのIDリストを返す
  const accessibleIds = allTenantsInOrg.map(t => t._id);
  return accessibleIds;
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