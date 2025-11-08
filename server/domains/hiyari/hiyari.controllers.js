const asyncHandler = require('express-async-handler'); // ★ express-async-handlerをインポート
const Hiyari = require('./hiyari.model'); // ★ Hiyariモデルをインポート (hを小文字に修正)
const { Parser } = require('json2csv'); // ★★★ json2csvからParserをインポート ★★★
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
    const accessibleTenantIds = await getAccessibleTenantIds(req.user);
    // ★★★ isHiddenがtrueでない投稿のみを取得するように条件を修正 ★★★
    const reports = await Hiyari.find({
      tenantId: { $in: accessibleTenantIds },
      isHidden: { $ne: true }, // 'true'ではないもの（falseまたはフィールドが存在しないもの）を取得
    })
      .populate('reportedBy', 'username')
      .populate('tenantId', 'name') // ★ 投稿部署の名前を取得するためにこの行を追加
      .sort({ incidentDate: -1 });
    res.json(reports);
  });

  /**
   * @route   POST /api/hiyari
   * @desc    新しいヒヤリハット報告を作成する
   * @access  Private
   */
  static createHiyariReport = asyncHandler(async (req, res) => {
    const { incidentDate, location, description, measures, category, tags } = req.body;

    // 必須項目チェック
    if (!incidentDate || !description) {
      res.status(400);
      // エラーメッセージを修正
      throw new Error('発生日時、詳細は必須項目です。');
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

    // ★★★ ここからが新しいロジック ★★★
    // レスポンスを返す前に、GETリクエストと同じようにpopulateを実行する
    await updatedHiyari.populate('reportedBy', 'username');
    await updatedHiyari.populate('tenantId', 'name');
    res.json(updatedHiyari);
  });

  // =================================================================
  // ★★★ ここからが新しい管理者用コントローラーメソッド ★★★
  // =================================================================

  /**
   * @route   GET /api/hiyari/admin
   * @desc    【管理者用】全てのヒヤリハット報告（非表示含む）を取得する
   * @access  Private (Hiyari-Admin)
   */
  static getHiyariReportsForAdmin = asyncHandler(async (req, res) => {
    // ★★★ isHiddenの条件を外して、全ての投稿を取得 ★★★
    const accessibleTenantIds = await getAccessibleTenantIds(req.user);
    const reports = await Hiyari.find({
      tenantId: { $in: accessibleTenantIds },
    })
      .populate('reportedBy', 'username')
      .populate('tenantId', 'name')
      .sort({ createdAt: -1 }); // 管理画面では作成順でソート
    res.json(reports);
  });

  /**
   * @route   PATCH /api/hiyari/:id/toggle-visibility
   * @desc    【管理者用】ヒヤリハット報告の表示/非表示を切り替える
   * @access  Private (Hiyari-Admin)
   */
  static toggleHiyariVisibility = asyncHandler(async (req, res) => {
    // ★★★ isHiddenフラグを反転させるロジック ★★★
    const accessibleTenantIds = await getAccessibleTenantIds(req.user);
    const hiyari = await Hiyari.findOne({
      _id: req.params.id,
      tenantId: { $in: accessibleTenantIds },
    });

    if (!hiyari) {
      res.status(404);
      throw new Error('報告が見つからないか、操作する権限がありません。');
    }

    hiyari.isHidden = !hiyari.isHidden;
    await hiyari.save();

    res.json({ message: `投稿を「${hiyari.isHidden ? '非表示' : '表示'}」に設定しました。`, isHidden: hiyari.isHidden });
  });

  /**
   * @route   PUT /api/hiyari/admin/:id
   * @desc    【管理者用】ヒヤリハット報告を更新する
   * @access  Private (Hiyari-Admin)
   */
  static updateHiyariReportByAdmin = asyncHandler(async (req, res) => {
    const { incidentDate, location, description, measures, category, tags } = req.body;

    const accessibleTenantIds = await getAccessibleTenantIds(req.user);
    const hiyari = await Hiyari.findOne({
      _id: req.params.id,
      tenantId: { $in: accessibleTenantIds },
    });

    if (!hiyari) {
      res.status(404);
      throw new Error('報告が見つからないか、操作する権限がありません。');
    }

    // データを更新（所有者チェックは行わない）
    hiyari.incidentDate = incidentDate || hiyari.incidentDate;
    hiyari.location = location || hiyari.location;
    hiyari.description = description || hiyari.description;
    hiyari.measures = measures || hiyari.measures;
    hiyari.category = category || hiyari.category;
    hiyari.tags = tags || hiyari.tags;

    const updatedHiyari = await hiyari.save();

    // フロントエンドのためにpopulateして返す
    await updatedHiyari.populate('reportedBy', 'username');
    await updatedHiyari.populate('tenantId', 'name');
    res.json(updatedHiyari);
  });

  /**
   * @route   GET /api/hiyari/export
   * @desc    【管理者用】ヒヤリハット報告をCSVでエクスポートする
   * @access  Private (Hiyari-Admin)
   */
  static exportHiyariReportsAsCsv = asyncHandler(async (req, res) => {
    const accessibleTenantIds = await getAccessibleTenantIds(req.user);
    const reports = await Hiyari.find({
      tenantId: { $in: accessibleTenantIds },
    })
      .populate('reportedBy', 'username')
      .populate('tenantId', 'name')
      .sort({ createdAt: -1 })
      .lean(); // パフォーマンス向上のためlean()を使用

    if (reports.length === 0) {
      return res.status(404).json({ message: 'エクスポート対象のデータがありません。' });
    }

    // CSVのヘッダーとフィールドを定義
    const fields = [
      { label: 'ID', value: '_id' },
      { label: '状態', value: (row) => row.isHidden ? '非表示' : '表示中' },
      { label: '発生日時', value: (row) => new Date(row.incidentDate).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) },
      { label: 'カテゴリ', value: 'category' },
      { label: '発生場所', value: 'location' },
      { label: '詳細', value: 'description' },
      { label: '投稿者', value: 'reportedBy.username' },
      { label: '投稿部署', value: 'tenantId.name' },
      { label: '投稿日時', value: (row) => new Date(row.createdAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) },
    ];

    const json2csvParser = new Parser({ fields, excelStrings: true, withBOM: true }); // ★★★ withBOM: true を追加して文字化けを解消 ★★★
    const csv = json2csvParser.parse(reports);

    const fileName = `hiyari-navi-export-${new Date().toISOString().slice(0, 10)}.csv`;

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment(fileName);
    res.send(csv);
  });
}

module.exports = HiyariController;