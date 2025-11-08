const express = require('express');
const router = express.Router();
const auth = require('../../core/middleware/auth');
const Hiyari = require('./hiyari.model'); // ★ Hiyariモデルをインポート (hを小文字に修正)
const canManageHiyari = require('../../core/middleware/canManageHiyari'); // ★★★ 新しいミドルウェアをインポート ★★★
const HiyariController = require('./hiyari.controllers'); // ★ HiyariControllerをインポート

/**
 * @route   GET /api/hiyari
 * @desc    アクセス可能なヒヤリハット報告を全て取得する
 * @access  Private
 */
router.get('/', auth, HiyariController.getHiyariReports);

/**
 * @route   POST /api/hiyari
 * @desc    新しいヒヤリハット報告を作成する
 * @access  Private
 */
router.post('/', auth, HiyariController.createHiyariReport);

/**
 * @route   DELETE /api/hiyari/:id
 * @desc    ヒヤリハット報告を削除する
 * @access  Private
 */
router.delete('/:id', auth, HiyariController.deleteHiyariReport);

/**
 * @route   PUT /api/hiyari/:id
 * @desc    ヒヤリハット報告を更新する
 * @access  Private
 */
router.put('/:id', auth, HiyariController.updateHiyariReport);

// =================================================================
// ★★★ ここからが新しい管理者用APIエンドポイント ★★★
// =================================================================

/**
 * @route   GET /api/hiyari/admin
 * @desc    【管理者用】全てのヒヤリハット報告（非表示含む）を取得する
 * @access  Private (Hiyari-Admin)
 */
router.get('/admin', [auth, canManageHiyari], HiyariController.getHiyariReportsForAdmin);

/**
 * @route   PATCH /api/hiyari/:id/toggle-visibility
 * @desc    【管理者用】ヒヤリハット報告の表示/非表示を切り替える
 * @access  Private (Hiyari-Admin)
 */
router.patch('/:id/toggle-visibility', [auth, canManageHiyari], HiyariController.toggleHiyariVisibility);

/**
 * @route   PUT /api/hiyari/admin/:id
 * @desc    【管理者用】ヒヤリハット報告を更新する
 * @access  Private (Hiyari-Admin)
 */
router.put('/admin/:id', [auth, canManageHiyari], HiyariController.updateHiyariReportByAdmin);

/**
 * @route   GET /api/hiyari/export
 * @desc    【管理者用】ヒヤリハット報告をCSVでエクスポートする
 * @access  Private (Hiyari-Admin)
 */
router.get('/export', [auth, canManageHiyari], HiyariController.exportHiyariReportsAsCsv);


module.exports = router;