const express = require('express');
const { createApplication, getApplications } = require('./applications.controller');
const protect = require('../../core/middleware/auth');
const { authorize } = require('../../core/middleware/authorize');

const router = express.Router();

router
  .route('/')
  .post(protect, authorize('admin', 'superuser'), createApplication)
  .get(protect, getApplications); // ★ GETルートを追加

module.exports = router;
