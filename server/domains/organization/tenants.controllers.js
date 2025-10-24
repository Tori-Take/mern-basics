const tenantService = require('./services/tenant.service');
const { getAccessibleTenantIds } = require('../../core/services/permissionService');

class TenantController {
  /**
   * ログインユーザーのテナント階層をツリー構造で取得します。
   */
  static async getTenantTree(req, res) {
    try {
      // ユーザーが所属する組織の最上位のルートIDを見つける
      const rootId = await tenantService.findOrganizationRoot(req.user.tenantId);

      // 階層データを取得
      const allTenantsInHierarchy = await tenantService.getTenantHierarchy(rootId);

      // ログインユーザーがアクセス可能なテナントIDリストを取得
      const accessibleTenantIds = await getAccessibleTenantIds(req.user.tenantId);

      // ツリー構造に変換（アクセス可能フラグを付与）
      const tenantTree = tenantService.buildTenantTree(allTenantsInHierarchy, accessibleTenantIds);

      res.status(200).json(tenantTree);
    } catch (error) {
      console.error('【GET /api/tenants/tree】 An error occurred:', error);
      res.status(500).json({ message: '組織図の取得に失敗しました。', error: error.message });
    }
  }
}

module.exports = TenantController;
