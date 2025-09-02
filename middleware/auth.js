const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const { ErrorHandler } = require('../utils/ErrorHandler');
const catchAsyncError = require('../utils/catchAsyncError');

const JWT_SECRET = process.env.JWT_SECRET || 'angelx-secret-key-2024';

// Generate JWT token
const generateToken = (id, type = 'user') => {
  return jwt.sign({ id, type }, JWT_SECRET, { expiresIn: '30d' });
};

// Verify JWT token
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

// Middleware to authenticate users
const authenticateUser = catchAsyncError(async (req, res, next) => {
  let token;
  
  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check for token in cookies
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new ErrorHandler('Access denied. No token provided.', 401));
  }

  // Verify token
  const decoded = verifyToken(token);
  
  if (decoded.type !== 'user') {
    return next(new ErrorHandler('Invalid token type.', 401));
  }

  // Get user from database
  const user = await User.findById(decoded.id).select('-__v');
  
  if (!user) {
    return next(new ErrorHandler('Token is valid but user not found.', 401));
  }

  req.user = user;
  next();
});

// Middleware to authenticate admins
const authenticateAdmin = catchAsyncError(async (req, res, next) => {
  let token;
  
  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check for token in cookies
  else if (req.cookies.adminToken) {
    token = req.cookies.adminToken;
  }

  if (!token) {
    return next(new ErrorHandler('Access denied. Admin token required.', 401));
  }

  // Verify token
  const decoded = verifyToken(token);
  
  if (decoded.type !== 'admin') {
    return next(new ErrorHandler('Invalid admin token.', 401));
  }

  // Get admin from database
  const admin = await Admin.findById(decoded.id).select('-password -__v');
  
  if (!admin) {
    return next(new ErrorHandler('Admin token is valid but admin not found.', 401));
  }

  req.admin = admin;
  next();
});

// Mask phone number for display
const maskPhone = (phone) => {
  if (!phone || phone.length < 5) return phone;
  return phone.substr(0, 3) + '*****' + phone.substr(-2);
};

module.exports = {
  generateToken,
  verifyToken,
  authenticateUser,
  authenticateAdmin,
  maskPhone
};