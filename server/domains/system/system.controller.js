const systemService = require('./system.service');
const tenantService = require('../organization/services/tenant.service');

class SystemController {
  /**
   * @description Get all tenants
   * @route GET /api/system/tenants
   */
  static async getAllTenants(req, res) {
    try {
      const tenants = await systemService.getAllTenants();
      res.status(200).json(tenants);
    } catch (err) {
      res.status(500).json({ message: 'テナント一覧の取得に失敗しました。', error: err.message });
    }
  }

  /**
   * @description Delete a tenant and its associated data
   * @route DELETE /api/system/tenants/:id
   */
  static async deleteTenant(req, res) {
    try {
      const { id } = req.params;
      await systemService.deleteTenantAndAssociatedData(id);
      res.status(200).json({ message: 'テナントおよび関連データが正常に削除されました。' });
    } catch (err) {
      // サービス層で発生したエラー（例：テナントが見つからない）をハンドリング
      res
        .status(err.statusCode || 500)
        .json({ message: err.message || 'テナントの削除に失敗しました。' });
    }
  }

  /**
   * @description Get organization chart for a specific tenant
   * @route GET /api/system/tenants/:id/tree
   */
  static async getTenantTreeById(req, res) {
    try {
      const { id } = req.params;
      const allTenantsInHierarchy = await tenantService.getTenantHierarchy(id);
      const tenantTree = tenantService.buildTenantTree(allTenantsInHierarchy);
      res.status(200).json(tenantTree);
    } catch (error) {
      res.status(500).json({ message: '組織図の取得に失敗しました。', error: error.message });
    }
  }

  /**
   * @description Get a hierarchical list of departments for a specific organization
   * @route GET /api/system/tenants/:id/departments
   */
  static async getDepartmentListById(req, res) {
    try {
      const { id } = req.params;
      const rootId = await tenantService.findOrganizationRoot(id);
      const allTenantsInHierarchy = await tenantService.getTenantHierarchy(rootId);
      
      // admin側のAPIと同様の処理を行う
      const tenantTree = tenantService.buildTenantTree(allTenantsInHierarchy);
      
      const flattenTreeWithDepth = (nodes, depth = 0) => {
        let list = [];
        nodes.forEach(node => {
          const { children, ...restOfNode } = node;
          list.push({ ...restOfNode, depth });
          if (children && children.length > 0) {
            list = list.concat(flattenTreeWithDepth(children, depth + 1));
          }
        });
        return list;
      };
      res.json(flattenTreeWithDepth(tenantTree));
    } catch (err) {
      res.status(500).json({ message: '部署一覧の取得に失敗しました。', error: err.message });
    }
  }
}

module.exports = SystemController;
