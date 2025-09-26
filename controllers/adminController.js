const Admin = require('../models/Admin');
const User = require('../models/User');
const DepositMethod = require('../models/DepositMethod');
const Deposit = require('../models/Deposit');
const { Exchange } = require('../models/Exchange');
const Withdraw = require('../models/Withdraw');
const mongoose = require('mongoose');
const { generateToken } = require('../middleware/auth');
const catchAsyncError = require('../utils/catchAsyncError');
const sendToken = require('../utils/sendToken');
const { ErrorHandler } = require('../utils/ErrorHandler');

// @desc    Register initial admin user
// @access  Public
const registerAdmin = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if admin already exists
  const existingAdmin = await Admin.findOne();
  console.log('existingAdmin:', existingAdmin)
  if (existingAdmin) {
    return next(new ErrorHandler('Admin already exists. Use login endpoint instead.', 400));
  }

  if (!email || !password) {
    return next(new ErrorHandler('Email and password are required', 400));
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(new ErrorHandler('Please provide a valid email address', 400));
  }

  // Validate password strength
  if (password.length < 6) {
    return next(new ErrorHandler('Password must be at least 6 characters long', 400));
  }

  // Create admin user
  const admin = new Admin({
    email: email.toLowerCase().trim(),
    password
  });

  await admin.save();

  // Send token using sendToken utility
  sendToken(admin, 201, res, 'admin');
});

// @desc    Admin login
// @access  Public
const adminLogin = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if admin exists
  const existingAdmin = await Admin.findOne();

  if (!existingAdmin) {
    return next(new ErrorHandler('No admin exists. Please register first.', 400));
  }

  if (!email || !password) {
    return next(new ErrorHandler('Email and password are required', 400));
  }

  // Find admin
  const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

  if (!admin) {
    return next(new ErrorHandler('Invalid credentials', 401));
  }

  // Check password
  const isValidPassword = await admin.comparePassword(password);

  if (!isValidPassword) {
    return next(new ErrorHandler('Invalid credentials', 401));
  }

  // Send token using sendToken utility
  sendToken(admin, 200, res, 'admin');
});

// @desc    Admin logout
// @access  Private (Admin)
const adminLogout = catchAsyncError(async (req, res, next) => {
  res.cookie('adminToken', null, {
    expires: new Date(Date.now()),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Admin logged out successfully'
  });
});

// @desc    Get admin dashboard data
// @access  Private (Admin)
const getAdminDashboard = catchAsyncError(async (req, res, next) => {
  // Get various statistics
  const totalUsers = await User.countDocuments();
  const totalBalance = await User.aggregate([
    { $group: { _id: null, total: { $sum: '$balance' } } }
  ]);

  const userStats = await User.aggregate([
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } },
    { $limit: 7 }
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalBalance: totalBalance[0]?.total || 0,
      recentUserRegistrations: userStats.reverse(),
      admin: {
        id: req.admin._id,
        email: req.admin.email
      }
    }
  });
});

// @desc    Get all users with pagination
// @access  Private (Admin)
const getAllUsers = catchAsyncError(async (req, res, next) => {
  const { page = 1, limit = 20, search } = req.query;

  let query = {};
  if (search) {
    query.phone = { $regex: search, $options: 'i' };
  }

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('-__v');

  const total = await User.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords: total
      }
    }
  });
});

// @desc    Update user balance
// @access  Private (Admin)
const updateUserBalance = catchAsyncError(async (req, res, next) => {
  const { balance, operation } = req.body;

  if (typeof balance !== 'number' || balance < 0) {
    return next(new ErrorHandler('Balance must be a non-negative number', 400));
  }

  if (!['set', 'add', 'subtract'].includes(operation)) {
    return next(new ErrorHandler('Operation must be set, add, or subtract', 400));
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHandler('User not found', 404));
  }

  const oldBalance = user.balance;

  switch (operation) {
    case 'set':
      user.balance = balance;
      break;
    case 'add':
      user.balance += balance;
      break;
    case 'subtract':
      user.balance = Math.max(0, user.balance - balance);
      break;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'User balance updated successfully',
    data: {
      userId: user._id,
      oldBalance,
      newBalance: user.balance,
      operation,
      amount: balance,
      updatedBy: req.admin.email
    }
  });
});

// @desc    Update admin WhatsApp number
// @access  Private (Admin)
const updateWhatsAppNumber = catchAsyncError(async (req, res, next) => {
  const { whatsappNumber } = req.body;

  if (!whatsappNumber) {
    return next(new ErrorHandler('WhatsApp number is required', 400));
  }

  // Validate WhatsApp number format (basic validation)
  // This regex allows for international format with optional + and spaces
  const whatsappRegex = /^\+?[1-9]\d{1,14}$/;
  if (!whatsappRegex.test(whatsappNumber.replace(/\s+/g, ''))) {
    return next(new ErrorHandler('Please provide a valid WhatsApp number', 400));
  }

  // Update admin's WhatsApp number
  const admin = await Admin.findByIdAndUpdate(
    req.admin._id,
    { whatsappNumber: whatsappNumber.trim() },
    { new: true, runValidators: true }
  ).select('-password -__v');

  if (!admin) {
    return next(new ErrorHandler('Admin not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'WhatsApp number updated successfully',
    data: {
      admin
    }
  });
});

// @desc    Get admin profile with WhatsApp number
// @access  Private (Admin)
const getAdminProfile = catchAsyncError(async (req, res, next) => {
  const admin = await Admin.findById(req.admin._id).select('-password -__v');

  if (!admin) {
    return next(new ErrorHandler('Admin not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      admin
    }
  });
});

const createDepositMethod = catchAsyncError(async (req, res, next) => {
  const { name, networkCode, address, qrPath } = req.body;
  
  if (!name || !networkCode || !address) {
    return next(new ErrorHandler('Name, network code, and address are required', 400));
  }

  // Check if network code already exists
  const existingMethod = await DepositMethod.findOne({ networkCode });
  if (existingMethod) {
    return next(new ErrorHandler('Network code already exists', 400));
  }

  const depositMethod = new DepositMethod({
    name: name.trim(),
    networkCode: networkCode.trim(),
    address: address.trim(),
    qrPath: qrPath ? qrPath.trim() : null
  });

  await depositMethod.save();

  res.status(201).json({
    success: true,
    message: 'Deposit method created successfully',
    data: {
      method: depositMethod
    }
  });
});

// @desc    Get all deposit methods
// @access  Private (Admin)
const getDepositMethods = catchAsyncError(async (req, res, next) => {
  const methods = await DepositMethod.find()
    .sort({ createdAt: -1 })
    .select('-__v');

  res.status(200).json({
    success: true,
    data: {
      methods
    }
  });
});

// @desc    Update deposit method
// @access  Private (Admin)
const updateDepositMethod = catchAsyncError(async (req, res, next) => {
  const { name, address, qrPath, isActive } = req.body;
  
  const method = await DepositMethod.findById(req.params.id);
  
  if (!method) {
    return next(new ErrorHandler('Deposit method not found', 404));
  }

  if (name) method.name = name.trim();
  if (address) method.address = address.trim();
  if (qrPath !== undefined) method.qrPath = qrPath ? qrPath.trim() : null;
  if (typeof isActive === 'boolean') method.isActive = isActive;

  await method.save();

  res.status(200).json({
    success: true,
    message: 'Deposit method updated successfully',
    data: {
      method
    }
  });
});

// @desc    Delete deposit method
// @access  Private (Admin)
const deleteDepositMethod = catchAsyncError(async (req, res, next) => {
  const method = await DepositMethod.findById(req.params.id);
  
  if (!method) {
    return next(new ErrorHandler('Deposit method not found', 404));
  }

  await DepositMethod.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Deposit method deleted successfully',
    data: {
      deletedMethod: {
        id: method._id,
        name: method.name,
        networkCode: method.networkCode
      }
    }
  });
});

// @desc    Bulk delete deposits
// @access  Private (Admin)
const bulkDeleteDeposits = catchAsyncError(async (req, res, next) => {
  const { ids } = req.body;

  // Validation
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorHandler('IDs array is required and cannot be empty', 400));
  }

  // Validate each ID
  for (const id of ids) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ErrorHandler(`Invalid ID: ${id}`, 400));
    }
  }

  // Delete deposits
  const result = await Deposit.deleteMany({ _id: { $in: ids } });

  res.status(200).json({
    success: true,
    message: `Successfully deleted ${result.deletedCount} deposit(s)`,
    data: {
      deletedCount: result.deletedCount,
      requestedCount: ids.length
    }
  });
});

// @desc    Bulk delete exchanges
// @access  Private (Admin)
const bulkDeleteExchanges = catchAsyncError(async (req, res, next) => {
  const { ids } = req.body;

  // Validation
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorHandler('IDs array is required and cannot be empty', 400));
  }

  // Validate each ID
  for (const id of ids) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ErrorHandler(`Invalid ID: ${id}`, 400));
    }
  }

  // Delete exchanges
  const result = await Exchange.deleteMany({ _id: { $in: ids } });

  res.status(200).json({
    success: true,
    message: `Successfully deleted ${result.deletedCount} exchange(s)`,
    data: {
      deletedCount: result.deletedCount,
      requestedCount: ids.length
    }
  });
});

// @desc    Bulk delete withdrawals
// @access  Private (Admin)
const bulkDeleteWithdrawals = catchAsyncError(async (req, res, next) => {
  const { ids } = req.body;

  // Validation
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorHandler('IDs array is required and cannot be empty', 400));
  }

  // Validate each ID
  for (const id of ids) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ErrorHandler(`Invalid ID: ${id}`, 400));
    }
  }

  // Delete withdrawals
  const result = await Withdraw.deleteMany({ _id: { $in: ids } });

  res.status(200).json({
    success: true,
    message: `Successfully deleted ${result.deletedCount} withdrawal(s)`,
    data: {
      deletedCount: result.deletedCount,
      requestedCount: ids.length
    }
  });
});

// @desc    Set withdrawal limit
// @access  Private (Admin)
const setWithdrawalLimit = catchAsyncError(async (req, res, next) => {
  const { limit } = req.body;

  // Validation
  if (typeof limit !== 'number' || limit < 0) {
    return next(new ErrorHandler('Limit must be a non-negative number', 400));
  }

  // Update admin's withdrawal limit
  const admin = await Admin.findByIdAndUpdate(
    req.admin._id,
    { withdrawalLimit: limit },
    { new: true, runValidators: true }
  ).select('-password -__v');

  if (!admin) {
    return next(new ErrorHandler('Admin not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Withdrawal limit updated successfully',
    data: {
      admin
    }
  });
});

// @desc    Get withdrawal limit
// @access  Private (Admin)
const getWithdrawalLimit = catchAsyncError(async (req, res, next) => {
  const admin = await Admin.findById(req.admin._id).select('withdrawalLimit');

  if (!admin) {
    return next(new ErrorHandler('Admin not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      withdrawalLimit: admin.withdrawalLimit
    }
  });
});

module.exports = {
  registerAdmin,
  adminLogin,
  adminLogout,
  getAdminDashboard,
  getAllUsers,
  updateUserBalance,
  updateWhatsAppNumber,
  getAdminProfile,
  createDepositMethod,
  updateDepositMethod,
  deleteDepositMethod,
  getDepositMethods,
  bulkDeleteDeposits,
  bulkDeleteExchanges,
  bulkDeleteWithdrawals,
  setWithdrawalLimit,
  getWithdrawalLimit
};