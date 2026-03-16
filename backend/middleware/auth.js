// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    console.log('🔐 ===== PROTECT MIDDLEWARE START =====');
    console.log('1. Headers:', req.headers.authorization);
    
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('❌ No token found');
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    console.log('2. Token found, verifying...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('3. Decoded token:', decoded);
    
    console.log('4. Finding user in database...');
    const user = await User.findById(decoded.id)
      .select('-password')
      .populate('department');

    if (!user) {
      console.log('❌ User not found in database');
      return res.status(401).json({ message: 'User not found' });
    }

    console.log('5. User found:', {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name
    });

    req.user = {
      id: user._id.toString(),
      _id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
      department: user.department?._id,
      departmentName: user.department?.name,
      semester: user.semester
    };
    
    console.log('6. req.user set with role:', req.user.role);
    console.log('🔐 ===== PROTECT MIDDLEWARE END =====');
    next();
  } catch (error) {
    console.error('❌ Auth error:', error.message);
    res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('🔑 AUTHORIZE FOR ROUTE:', req.originalUrl);
    console.log('🔑 Required roles:', roles);
    console.log('🔑 ===== AUTHORIZE MIDDLEWARE =====');
    console.log('1. req.user exists?', !!req.user);
    if (req.user) {
      console.log('2. req.user.role:', req.user.role);
      console.log('3. req.user.role type:', typeof req.user.role);
      console.log('4. req.user.role length:', req.user.role?.length);
      console.log('5. req.user.role char codes:', req.user.role?.split('').map(c => c.charCodeAt(0)));
    }
    console.log('6. Required roles:', roles);
    console.log('7. Required roles types:', roles.map(r => typeof r));
    console.log('8. Required roles lengths:', roles.map(r => r?.length));
    
    if (!req.user) {
      console.log('❌ No user in request');
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    console.log('9. Checking if', req.user.role, 'is in', roles);
    const hasRole = roles.includes(req.user.role);
    console.log('10. Has required role?', hasRole);
    
    // Try with trim to be safe
    const trimmedRole = req.user.role?.trim();
    const hasRoleTrimmed = roles.some(r => r === trimmedRole);
    console.log('11. Trimmed role:', trimmedRole);
    console.log('12. Has required role (trimmed)?', hasRoleTrimmed);
    
    if (!hasRole && !hasRoleTrimmed) {
      console.log(`❌ Role ${req.user.role} not authorized`);
      return res.status(403).json({ 
        message: `Role ${req.user.role} is not authorized`
      });
    }
    
    console.log('✅ Authorization passed');
    console.log('🔑 ===== AUTHORIZE MIDDLEWARE END =====');
    next();
  };
};

module.exports = { protect, authorize };