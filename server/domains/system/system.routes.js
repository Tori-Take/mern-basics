const express = require('express');
const router = express.Router();
const auth = require('../../core/middleware/auth');
const superuser = require('../../core/middleware/superuser');
const SystemController = require('./system.controller');

/**
 * @route   GET /api/system/tenants
 * @desc    Get a list of all tenants in the system (Superuser only)
 * @access  Private/Superuser
 */
router.get('/tenants', [auth, superuser], SystemController.getAllTenants);

/**
 * @route   DELETE /api/system/tenants/:id
 * @desc    Delete a tenant and all associated data (Superuser only)
 * @access  Private/Superuser
 */
router.delete('/tenants/:id', [auth, superuser], SystemController.deleteTenant);

/**
 * @route   GET /api/system/tenants/:id/tree
 * @desc    Get organization chart for a specific tenant (Superuser only)
 * @access  Private/Superuser
 */
router.get('/tenants/:id/tree', [auth, superuser], SystemController.getTenantTreeById);

module.exports = router;
