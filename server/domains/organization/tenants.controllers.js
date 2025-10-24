const tenantService = require('./services/tenant.service');

class TenantController {
  /**
   * ログインユーザーのテナント階層をツリー構造で取得します。
   */
  static async getTenantTree(req, res) {
    try {
      // ログインユーザーのテナントIDとその全ての子孫テナントを取得
      const allTenantsInHierarchy = await tenantService.getTenantHierarchy(req.user.tenantId);

      // ツリー構造に変換
      const tenantTree = tenantService.buildTenantTree(allTenantsInHierarchy);
      res.status(200).json(tenantTree);
    } catch (error) {
      console.error('【GET /api/tenants/tree】 An error occurred:', error);
      res.status(500).json({ message: '組織図の取得に失敗しました。', error: error.message });
    }
  }
}

module.exports = TenantController;
