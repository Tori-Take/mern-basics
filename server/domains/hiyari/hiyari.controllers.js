const asyncHandler = require('express-async-handler'); // ★ express-async-handlerをインポート
const Hiyari = require('./Hiyari.model');
const { getAccessibleTenantIds } = require('../../core/services/permissionService');

/**
 * @class HiyariController
 * @description ヒヤリハット報告に関するHTTPリクエストを処理します。
 */
class HiyariController {
  /**
   * @route   GET /api/hiyari
   * @desc    アクセス可能なヒヤリハット報告を全て取得する
   * @access  Private
   */
  static getHiyariReports = asyncHandler(async (req, res) => {
    console.log('--- [BE /api/hiyari] Request Received ---');
    console.log('[BE Hiyari] 1. Operator:', { id: req.user.id, username: req.user.username, roles: req.user.roles });

    const accessibleTenantIds = await getAccessibleTenantIds(req.user);
    console.log('[BE Hiyari] 2. Accessible Tenant IDs:', accessibleTenantIds.map(id => id.toString()));

    const reports = await Hiyari.find({ tenantId: { $in: accessibleTenantIds } })
      .populate('reportedBy', 'username')
      .sort({ incidentDate: -1 });

    console.log(`[BE Hiyari] 3. Found ${reports.length} reports.`);
    res.json(reports);
  });
}

module.exports = HiyariController;