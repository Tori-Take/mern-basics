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

  /**
   * @route   POST /api/hiyari
   * @desc    新しいヒヤリハット報告を作成する
   * @access  Private
   */
  static createHiyariReport = asyncHandler(async (req, res) => {
    // ★★★ デバッグログを追加 ★★★
    console.log('[BE Hiyari POST] Received request body:', req.body);

    const { incidentDate, location, description, measures, category, tags } = req.body;

    // ★★★ 修正: 必須項目チェックを緩和し、「場所」を任意項目にする ★★★
    if (!incidentDate || !description) {
      res.status(400);
      // エラーメッセージも修正
      throw new Error('発生日時、状況は必須項目です。');
    }

    const hiyari = new Hiyari({
      tenantId: req.user.tenantId, // 報告者の所属テナントID
      reportedBy: req.user.id,     // 報告者のユーザーID
      incidentDate, location, description, measures, category, tags,
    });

    const createdHiyari = await hiyari.save();
    res.status(201).json(createdHiyari);
  });

  /**
   * @route   DELETE /api/hiyari/:id
   * @desc    ヒヤリハット報告を削除する
   * @access  Private
   */
  static deleteHiyariReport = asyncHandler(async (req, res) => {
    const hiyari = await Hiyari.findById(req.params.id);

    if (!hiyari) {
      res.status(404);
      throw new Error('報告が見つかりません。');
    }

    // --- 権限チェック ---
    // 報告者本人か、またはadminロールを持つユーザーのみ削除を許可
    const isOwner = hiyari.reportedBy.toString() === req.user.id.toString();
    const isAdmin = req.user.roles.includes('admin');

    if (!isOwner && !isAdmin) {
      res.status(403);
      throw new Error('この報告を削除する権限がありません。');
    }

    await hiyari.deleteOne(); // Mongoose v6以降では .remove() は非推奨

    res.json({ message: 'ヒヤリハット報告が削除されました。' });
  });

  /**
   * @route   PUT /api/hiyari/:id
   * @desc    ヒヤリハット報告を更新する
   * @access  Private
   */
  static updateHiyariReport = asyncHandler(async (req, res) => {
    const { incidentDate, location, description, measures, category, tags } = req.body;

    const hiyari = await Hiyari.findById(req.params.id);

    if (!hiyari) {
      res.status(404);
      throw new Error('報告が見つかりません。');
    }

    // --- 権限チェック ---
    // 報告者本人か、またはadminロールを持つユーザーのみ更新を許可
    const isOwner = hiyari.reportedBy.toString() === req.user.id.toString();
    const isAdmin = req.user.roles.includes('admin');

    if (!isOwner && !isAdmin) {
      res.status(403);
      throw new Error('この報告を更新する権限がありません。');
    }

    // データを更新
    hiyari.incidentDate = incidentDate || hiyari.incidentDate;
    hiyari.location = location || hiyari.location;
    hiyari.description = description || hiyari.description;
    hiyari.measures = measures || hiyari.measures;
    hiyari.category = category || hiyari.category;
    hiyari.tags = tags || hiyari.tags;

    const updatedHiyari = await hiyari.save();
    res.json(updatedHiyari);
  });
}

module.exports = HiyariController;