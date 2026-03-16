// routes/twoFactorRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  setup2FA,
  verifyAndEnable2FA,
  disable2FA,
  generateNewBackupCodes,
  get2FAStatus
} = require('../controllers/twoFactorController');

// All routes require authentication
router.use(protect);

// Get 2FA status
router.get('/status', get2FAStatus);

// Setup 2FA
router.post('/setup', setup2FA);

// Verify and enable 2FA
router.post('/verify', [
  body('token').isLength({ min: 6, max: 6 }).withMessage('Invalid verification code')
], verifyAndEnable2FA);

// Disable 2FA
router.post('/disable', [
  body('password').notEmpty().withMessage('Password is required')
], disable2FA);

// Generate new backup codes
router.post('/backup-codes', [
  body('token').isLength({ min: 6, max: 6 }).withMessage('Invalid verification code')
], generateNewBackupCodes);

module.exports = router;