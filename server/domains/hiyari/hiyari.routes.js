const express = require('express');
const router = express.Router();
const auth = require('../../core/middleware/auth');
const Hiyari = require('./Hiyari.model');
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

module.exports = router;