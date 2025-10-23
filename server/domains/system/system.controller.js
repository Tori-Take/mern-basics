const SystemService = require('./services/system.service');

const systemService = new SystemService();

class SystemController {
  /**
   * @description Get all tenants
   * @route GET /api/system/tenants
   */
  static async getAllTenants(req, res) {
    try {
      const tenants = await systemService.findAllTenants();
      res.json(tenants);
    } catch (err) {
      res.status(500).json({ message: 'サーバーエラーが発生しました。' });
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
      res.json({ message: 'テナントおよび関連データが正常に削除されました。' });
    } catch (err) {
      // サービス層で発生したエラー（例：テナントが見つからない）をハンドリング
      res
        .status(err.statusCode || 500)
        .json({ message: err.message || 'サーバーエラーが発生しました。' });
    }
  }
}

module.exports = SystemController;
