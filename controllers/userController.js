const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Deposit = require('../models/Deposit');
const Withdraw = require('../models/Withdraw');
const { maskPhone } = require('../middleware/auth');
const catchAsyncError = require('../utils/catchAsyncError');
const { ErrorHandler } = require('../utils/ErrorHandler');

// @desc    Get user profile information
// @access  Private
const getProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('-__v');
  
  if (!user) {
    return next(new ErrorHandler('User not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        phone: user.phone,
        maskedPhone: maskPhone(user.phone),
        balance: user.balance,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }
  });
});

// @desc    Get user balance
// @access  Private
const getBalance = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('balance');
  
  if (!user) {
    return next(new ErrorHandler('User not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      balance: user.balance
    }
  });
});

// @desc    Get user dashboard data
// @access  Private
const getDashboard = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('-__v');
  
  // Get recent transactions
  const recentTransactions = await Transaction.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('-__v');

  // Get pending counts
  const pendingDeposits = await Deposit.countDocuments({ 
    userId: req.user._id, 
    status: { $in: ['pending', 'awaiting_txid', 'processing'] }
  });

  const pendingWithdrawals = await Withdraw.countDocuments({ 
    userId: req.user._id, 
    status: 'pending'
  });

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        phone: user.phone,
        maskedPhone: maskPhone(user.phone),
        balance: user.balance,
        createdAt: user.createdAt
      },
      statistics: {
        pendingDeposits,
        pendingWithdrawals,
        totalTransactions: recentTransactions.length
      },
      recentTransactions
    }
  });
});

// @desc    Get user transaction history
// @access  Private
const getTransactions = catchAsyncError(async (req, res, next) => {
  const { page = 1, limit = 10, type, status } = req.query;
  
  const query = { userId: req.user._id };
  if (type && ['deposit', 'withdrawal'].includes(type)) {
    query.type = type;
  }
  if (status && ['completed', 'processing'].includes(status)) {
    query.status = status;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 }
  };

  const transactions = await Transaction.find(query)
    .sort(options.sort)
    .limit(options.limit * 1)
    .skip((options.page - 1) * options.limit)
    .select('-__v');

  const total = await Transaction.countDocuments(query);
  const totalPages = Math.ceil(total / options.limit);

  res.status(200).json({
    success: true,
    data: {
      transactions,
      pagination: {
        currentPage: options.page,
        totalPages,
        totalRecords: total,
        hasNext: options.page < totalPages,
        hasPrev: options.page > 1
      }
    }
  });
});

// @desc    Get user statistics
// @access  Private
const getUserStats = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;

  // Aggregate transaction statistics
  const transactionStats = await Transaction.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: {
          type: '$type',
          status: '$status'
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  // Aggregate deposit statistics
  const depositStats = await Deposit.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  // Aggregate withdrawal statistics  
  const withdrawStats = await Withdraw.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      transactions: transactionStats,
      deposits: depositStats,
      withdrawals: withdrawStats
    }
  });
});

module.exports = {
  getProfile,
  getBalance,
  getDashboard,
  getTransactions,
  getUserStats
};