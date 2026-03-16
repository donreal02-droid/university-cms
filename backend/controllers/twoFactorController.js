// controllers/twoFactorController.js
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');
const crypto = require('crypto');

// @desc    Generate 2FA secret and QR code
// @route   POST /api/2fa/setup
// @access  Private
const setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `University CMS (${user.email})`,
      issuer: 'University CMS'
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Temporarily store secret (not enabled yet)
    user.twoFactorSecret = secret.base32;
    await user.save();

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    res.json({
      success: true,
      secret: secret.base32,
      qrCode,
      backupCodes
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify and enable 2FA
// @route   POST /api/2fa/verify
// @access  Private
const verifyAndEnable2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA not set up' });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps (60 seconds) for clock drift
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Generate and save backup codes
    const backupCodes = generateBackupCodes();
    
    // Save hashed backup codes
    user.backupCodes = backupCodes.map(code => ({
      code: crypto.createHash('sha256').update(code).digest('hex'),
      used: false
    }));
    
    user.twoFactorEnabled = true;
    await user.save();

    res.json({
      success: true,
      message: '2FA enabled successfully',
      backupCodes: backupCodes // Send plain codes for user to save
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Disable 2FA
// @route   POST /api/2fa/disable
// @access  Private
const disable2FA = async (req, res) => {
  try {
    const { password, token } = req.body;
    const user = await User.findById(req.user._id);

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // If token provided, verify it
    if (token) {
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 2
      });

      if (!verified) {
        return res.status(400).json({ message: 'Invalid 2FA code' });
      }
    }

    // Disable 2FA
    user.twoFactorSecret = null;
    user.twoFactorEnabled = false;
    user.twoFactorMethod = 'app';
    user.backupCodes = [];
    await user.save();

    res.json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Generate new backup codes
// @route   POST /api/2fa/backup-codes
// @access  Private
const generateNewBackupCodes = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id);

    // Verify 2FA token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid 2FA code' });
    }

    // Generate new backup codes
    const backupCodes = generateBackupCodes();
    
    user.backupCodes = backupCodes.map(code => ({
      code: crypto.createHash('sha256').update(code).digest('hex'),
      used: false
    }));
    
    await user.save();

    res.json({
      success: true,
      backupCodes
    });
  } catch (error) {
    console.error('Backup codes generation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get 2FA status
// @route   GET /api/2fa/status
// @access  Private
const get2FAStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('twoFactorEnabled twoFactorMethod');
    
    res.json({
      success: true,
      enabled: user.twoFactorEnabled,
      method: user.twoFactorMethod
    });
  } catch (error) {
    console.error('2FA status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to generate backup codes
const generateBackupCodes = (count = 8) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code.match(/.{1,4}/g).join('-'));
  }
  return codes;
};

module.exports = {
  setup2FA,
  verifyAndEnable2FA,
  disable2FA,
  generateNewBackupCodes,
  get2FAStatus
};