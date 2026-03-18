const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const User = require('../models/User');
const Session = require('../models/Session');
const {
  // Auth controllers
  register,
  login,
  verify2FA,
  resend2FACode,
  getProfile,
  updateProfile,
  changePassword,
  uploadProfileImage,
  deleteAccount,
  
  // 2FA controllers
  setup2FA,
  verifyAndEnable2FA,
  disable2FA,
  generateNewBackupCodes,
  get2FAStatus
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Validation rules
const registerValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
    .toLowerCase(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/)
    .withMessage('Password must contain at least one uppercase letter, one number, and one special character'),
  
  body('role')
    .optional()
    .isIn(['admin', 'teacher', 'student'])
    .withMessage('Invalid role'),
  
  body('department')
    .optional()
    .isMongoId()
    .withMessage('Invalid department ID'),
  
  body('semester')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester must be between 1 and 8'),
  
  body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]{10,15}$/)
    .withMessage('Please enter a valid phone number'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
    .toLowerCase(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const passwordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/)
    .withMessage('New password must contain at least one uppercase letter, one number, and one special character')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
  
  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your new password')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

const profileUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]{10,15}$/)
    .withMessage('Please enter a valid phone number'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters'),
  
  body('semester')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester must be between 1 and 8')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
    .toLowerCase()
];

const resetPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
    .toLowerCase(),
  
  body('code')
    .notEmpty()
    .withMessage('Reset code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Reset code must be 6 digits')
    .isNumeric()
    .withMessage('Reset code must contain only numbers'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/)
    .withMessage('New password must contain at least one uppercase letter, one number, and one special character'),
  
  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your new password')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

// 2FA Validation Rules
const twoFactorVerifyValidation = [
  body('tempToken')
    .notEmpty()
    .withMessage('Temporary token is required'),
  body('token')
    .notEmpty()
    .withMessage('Verification code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
];

const twoFactorSetupValidation = [
  body('token')
    .optional()
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
];

const twoFactorDisableValidation = [
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('token')
    .optional()
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
];

// ============ PUBLIC ROUTES ============
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/verify-2fa', twoFactorVerifyValidation, verify2FA);
router.post('/resend-2fa-code', resend2FACode);

// Password reset routes
router.post('/forgot-password', forgotPasswordValidation, async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ 
        message: 'If an account exists with this email, a reset code has been sent.' 
      });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.resetCode = resetCode;
    user.resetCodeExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    console.log(`Reset code for ${email}: ${resetCode}`);
    
    res.json({ 
      message: 'If an account exists with this email, a reset code has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/reset-password', resetPasswordValidation, async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const user = await User.findOne({ 
      email,
      resetCode: code,
      resetCodeExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    user.password = newPassword;
    user.resetCode = undefined;
    user.resetCodeExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. Please login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ PROTECTED ROUTES (require authentication) ============
router.get('/profile', protect, getProfile);
router.put('/profile', protect, profileUpdateValidation, updateProfile);
router.put('/change-password', protect, passwordValidation, changePassword);
router.post('/profile/image', protect, upload.single('profile'), uploadProfileImage);
router.delete('/account', protect, deleteAccount);

// ============ 2FA ROUTES (require authentication) ============
router.get('/2fa/status', protect, get2FAStatus);
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/verify', protect, twoFactorSetupValidation, verifyAndEnable2FA);
router.post('/2fa/disable', protect, twoFactorDisableValidation, disable2FA);
router.post('/2fa/backup-codes', protect, twoFactorSetupValidation, generateNewBackupCodes);

// ============ SESSION MANAGEMENT ROUTES (ADD THESE ONLY) ============

// Get all active sessions for the current user
router.get('/active-sessions', protect, async (req, res) => {
  try {
    const currentToken = req.headers.authorization?.replace('Bearer ', '');
    
    const sessions = await Session.find({ 
      userId: req.user.id 
    })
    .sort({ lastActive: -1 })
    .lean();

    const sessionsWithCurrent = sessions.map(session => ({
      ...session,
      isCurrent: session.sessionId === currentToken
    }));

    res.json({
      sessions: sessionsWithCurrent
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ 
      message: 'Error fetching sessions' 
    });
  }
});

// Terminate a specific session
router.delete('/sessions/:sessionId', protect, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const currentToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (sessionId === currentToken) {
      return res.status(400).json({ 
        message: 'Cannot terminate current session' 
      });
    }

    await Session.findOneAndDelete({
      userId: req.user.id,
      sessionId: sessionId
    });

    res.json({ 
      message: 'Session terminated successfully' 
    });
  } catch (error) {
    console.error('Error terminating session:', error);
    res.status(500).json({ 
      message: 'Error terminating session' 
    });
  }
});

// Terminate all other sessions
router.delete('/sessions/others', protect, async (req, res) => {
  try {
    const currentToken = req.headers.authorization?.replace('Bearer ', '');
    
    await Session.deleteMany({
      userId: req.user.id,
      sessionId: { $ne: currentToken }
    });

    res.json({ 
      message: 'All other sessions terminated' 
    });
  } catch (error) {
    console.error('Error terminating sessions:', error);
    res.status(500).json({ 
      message: 'Error terminating sessions' 
    });
  }
});

// ============ EMAIL VERIFICATION ROUTES ============
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/resend-verification', 
  body('email').isEmail().normalizeEmail(),
  async (req, res) => {
    try {
      const { email } = req.body;
      
      const user = await User.findOne({ email });
      if (!user) {
        return res.json({ message: 'If an account exists, a verification email has been sent.' });
      }

      res.json({ message: 'Verification email sent' });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;