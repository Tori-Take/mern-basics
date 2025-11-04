const express = require('express');
const router = express.Router();
const auth = require('../../core/middleware/auth');

// --- ★★★ 全てのhiyari APIを認証ミドルウェアで保護 ★★★ ---
router.use(auth);

// /api/hiyari というルートに対する設定
router.route('/')
  .post((req, res) => require('./hiyari.controllers').createHiyari(req, res))
  .get((req, res) => require('./hiyari.controllers').getHiyaris(req, res));

// /api/hiyari/:id というルートに対する設定
router.route('/:id')
  .put((req, res) => require('./hiyari.controllers').updateHiyari(req, res))
  .delete((req, res) => require('./hiyari.controllers').deleteHiyari(req, res));

module.exports = router;
