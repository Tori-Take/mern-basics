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

module.exports = router;