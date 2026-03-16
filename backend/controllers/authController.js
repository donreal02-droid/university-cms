const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const validatePassword = require('../utils/passwordValidator');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

// Generate JWT Token - UPDATED to include role
const generateToken = (id, role) => {
  return jwt.sign(
    { 
      id, 
      role  // ✅ Added role to token
    }, 
    process.env.JWT_SECRET || 'your-secret-key', 
    {
      expiresIn: '30d'
    }
  );
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, department, semester, registrationNumber, phone, address } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors 
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      department,
      semester,
      registrationNumber,
      phone,
      address
    });

    if (user) {
      res.status(201).json({
        success: true,
        message: 'Registration successful! Please login with your credentials.',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          semester: user.semester
        }
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Find user
    const user = await User.findOne({ email }).populate('department', 'name code');
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password incorrect for:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated. Please contact administrator.' });
    }

    // 🔐 CHECK IF 2FA IS ENABLED
    if (user.twoFactorEnabled) {
      // Generate a temporary token for 2FA verification (expires in 5 minutes)
      const tempToken = jwt.sign(
        { 
          id: user._id, 
          requires2FA: true,
          email: user.email,
          role: user.role  // ✅ Added role to temp token
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '5m' }
      );

      console.log('2FA required for:', email);

      return res.json({
        requires2FA: true,
        tempToken,
        method: user.twoFactorMethod || 'app',
        message: 'Two-factor authentication required',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }

    // ✅ NO 2FA - Generate regular token with role
    const token = generateToken(user._id, user.role);  // ✅ Pass role

    console.log('Login successful for:', email);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      semester: user.semester,
      enrollmentNumber: user.enrollmentNumber,
      profileImage: user.profileImage,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Verify 2FA token after login
// @route   POST /api/auth/verify-2fa
// @access  Public (with temp token)
const verify2FA = async (req, res) => {
  try {
    const { tempToken, token, isBackupCode } = req.body;
    
    console.log('🔍 Backend verify2FA called:');
    console.log('  - tempToken present:', !!tempToken);
    console.log('  - token:', token);
    console.log('  - isBackupCode:', isBackupCode);

    // Verify temporary token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'your-secret-key');
      console.log('  - decoded token:', decoded);
    } catch (err) {
      console.error('  - JWT verification failed:', err.message);
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    }
    
    if (!decoded.requires2FA) {
      return res.status(400).json({ message: 'Invalid verification request' });
    }

    const user = await User.findById(decoded.id).populate('department', 'name code');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled for this account' });
    }

    console.log('  - user found:', user.email);
    console.log('  - 2FA enabled:', user.twoFactorEnabled);
    console.log('  - has 2FA secret:', !!user.twoFactorSecret);
    console.log('  - has backup codes:', user.backupCodes?.length || 0);

    let verified = false;

    if (isBackupCode) {
      // Check backup code
      const crypto = require('crypto');
      const hashedCode = crypto.createHash('sha256').update(token).digest('hex');
      console.log('  - checking backup code, hashed:', hashedCode);
      
      // Find unused backup code
      const backupCodeIndex = user.backupCodes.findIndex(
        bc => bc.code === hashedCode && !bc.used
      );
      
      if (backupCodeIndex !== -1) {
        console.log('  - valid backup code found at index:', backupCodeIndex);
        user.backupCodes[backupCodeIndex].used = true;
        await user.save();
        verified = true;
      } else {
        console.log('  - no matching unused backup code found');
      }
    } else {
      // Verify TOTP code
      console.log('  - verifying TOTP with secret:', user.twoFactorSecret?.substring(0, 5) + '...');
      
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 4 // Increased window for time drift
      });
      
      console.log('  - TOTP verification result:', verified);
    }

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Generate final authentication token with role
    const authToken = generateToken(user._id, user.role);  // ✅ Pass role

    console.log('✅ 2FA verification successful for:', user.email);

    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      semester: user.semester,
      enrollmentNumber: user.enrollmentNumber,
      profileImage: user.profileImage,
      token: authToken
    });
  } catch (error) {
    console.error('❌ 2FA verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '2FA session expired. Please login again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid verification token' });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Resend 2FA code (for SMS/Email methods)
// @route   POST /api/auth/resend-2fa-code
// @access  Public (with temp token)
const resend2FACode = async (req, res) => {
  try {
    const { tempToken } = req.body;

    // Verify temporary token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'your-secret-key');
    
    if (!decoded.requires2FA) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate new 2FA code based on method
    let code;
    switch (user.twoFactorMethod) {
      case 'sms':
        code = Math.floor(100000 + Math.random() * 900000).toString();
        // TODO: Integrate SMS service (Twilio, etc.)
        user.twoFactorTempCode = code;
        user.twoFactorTempCodeExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
        await user.save();
        console.log(`SMS code for ${user.email}: ${code}`); // Remove in production
        break;
        
      case 'email':
        code = Math.floor(100000 + Math.random() * 900000).toString();
        // TODO: Integrate email service (Nodemailer, etc.)
        user.twoFactorTempCode = code;
        user.twoFactorTempCodeExpiry = Date.now() + 5 * 60 * 1000;
        await user.save();
        console.log(`Email code for ${user.email}: ${code}`); // Remove in production
        break;
        
      default:
        return res.status(400).json({ message: 'Cannot resend code for authenticator app' });
    }

    res.json({
      success: true,
      message: `Verification code sent to your ${user.twoFactorMethod}`
    });
  } catch (error) {
    console.error('Resend 2FA code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('department', 'name code description');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;
    
    if (req.body.semester) {
      user.semester = req.body.semester;
    }

    if (req.body.password) {
      const passwordValidation = validatePassword(req.body.password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          message: 'Password does not meet requirements',
          errors: passwordValidation.errors 
        });
      }
      user.password = req.body.password;
    }

    if (req.file) {
      user.profileImage = req.file.filename;
    }

    const updatedUser = await user.save();

    // Generate new token with updated info
    const token = generateToken(updatedUser._id, updatedUser.role);

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      department: updatedUser.department,
      semester: updatedUser.semester,
      phone: updatedUser.phone,
      address: updatedUser.address,
      profileImage: updatedUser.profileImage,
      token
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        message: 'New password does not meet requirements',
        errors: passwordValidation.errors 
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Upload profile image
// @route   POST /api/auth/profile/image
// @access  Private
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image' });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Store ONLY the filename
    const filename = req.file.filename;
    user.profileImage = filename;
    await user.save();

    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('department', 'name');

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete user account
// @route   DELETE /api/auth/account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has any active submissions or assignments
    const Submission = require('../models/Submission');
    const Assignment = require('../models/Assignment');
    
    const hasSubmissions = await Submission.exists({ student: user._id });
    const hasAssignments = user.role === 'teacher' 
      ? await Assignment.exists({ teacher: user._id })
      : false;

    if (hasSubmissions || hasAssignments) {
      return res.status(400).json({ 
        message: 'Cannot delete account with existing academic records. Please contact administration.' 
      });
    }

    await user.deleteOne();
    res.json({ 
      success: true,
      message: 'Account deleted successfully' 
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ==================== 2FA CONTROLLERS ====================

// @desc    Setup 2FA - Generate secret and QR code
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
    res.status(500).json({ message: 'Server error', error: error.message });
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
      window: 2
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
    res.status(500).json({ message: 'Server error', error: error.message });
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
    res.status(500).json({ message: 'Server error', error: error.message });
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
    res.status(500).json({ message: 'Server error', error: error.message });
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
    res.status(500).json({ message: 'Server error', error: error.message });
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
  // Auth controllers
  register,
  login,
  verify2FA,
  resend2FACode,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  uploadProfileImage,
  
  // 2FA controllers
  setup2FA,
  verifyAndEnable2FA,
  disable2FA,
  generateNewBackupCodes,
  get2FAStatus
};