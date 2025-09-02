const DepositMethod = require('../models/DepositMethod');
const Deposit = require('../models/Deposit');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const ExchangeRate = require('../models/ExchangeRate');
const catchAsyncError = require('../utils/catchAsyncError');
const { ErrorHandler } = require('../utils/ErrorHandler');

// @desc    Get all active deposit methods
// @access  Public
const getDepositMethods = catchAsyncError(async (req, res, next) => {
  const methods = await DepositMethod.find({ isActive: true })
    .sort({ _id: 1 })
    .select('-__v');

  res.status(200).json({
    success: true,
    data: {
      methods
    }
  });
});

// @desc    Create new deposit request
// @access  Private
const createDeposit = catchAsyncError(async (req, res, next) => {
  const { methodId, amount } = req.body;
  
  // Validation
  if (!methodId || !amount || amount <= 0) {
    return next(new ErrorHandler('Method ID and valid amount are required', 400));
  }

  // Check if method exists and is active
  const method = await DepositMethod.findOne({
    _id: methodId,
    isActive: true
  });

  if (!method) {
    return next(new ErrorHandler('Deposit method not found or inactive', 404));
  }

  // Set expiry time (30 minutes from now)
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 30);

  // Create deposit record
  const deposit = new Deposit({
    userId: req.user._id,
    methodId,
    amount,
    status: 'pending',
    expiresAt
  });

  await deposit.save();

  // Populate method details
  await deposit.populate('methodId', 'name networkCode address qrPath');

  res.status(201).json({
    success: true,
    message: 'Deposit request created successfully',
    data: {
      deposit: {
        id: deposit._id,
        amount: deposit.amount,
        status: deposit.status,
        expiresAt: deposit.expiresAt,
        method: deposit.methodId,
        createdAt: deposit.createdAt
      }
    }
  });
});

// @desc    Submit transaction ID for deposit
// @access  Private
const submitTxid = catchAsyncError(async (req, res, next) => {
  const { depositId, txid } = req.body;
  
  if (!depositId || !txid || txid.trim().length === 0) {
    return next(new ErrorHandler('Deposit ID and transaction ID are required', 400));
  }

  // Find deposit
  const deposit = await Deposit.findOne({
    _id: depositId,
    userId: req.user._id
  });

  if (!deposit) {
    return next(new ErrorHandler('Deposit not found', 404));
  }

  // Check if deposit is in correct status
  if (deposit.status !== 'pending') {
    return next(new ErrorHandler('Deposit is not in pending status', 400));
  }

  // Check if not expired
  if (new Date() > deposit.expiresAt) {
    deposit.status = 'expired';
    await deposit.save();
    
    return next(new ErrorHandler('Deposit request has expired', 400));
  }

  // Validate TXID length
  const cleanTxid = txid.trim();
  if (cleanTxid.length > 160) {
    return next(new ErrorHandler('Transaction ID is too long', 400));
  }

  // Update deposit with TXID
  deposit.txid = cleanTxid;
  deposit.status = 'awaiting_txid';
  await deposit.save();

  res.status(200).json({
    success: true,
    message: 'Transaction ID submitted successfully. Deposit is being processed.',
    data: {
      depositId: deposit._id,
      txid: deposit.txid,
      status: deposit.status
    }
  });
});

// @desc    Get user's deposit history
// @access  Private
const getDepositHistory = catchAsyncError(async (req, res, next) => {
  const { page = 1, limit = 10, status } = req.query;
  
  const query = { userId: req.user._id };
  if (status) {
    query.status = status;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 }
  };

  const deposits = await Deposit.find(query)
    .populate('methodId', 'name networkCode')
    .sort(options.sort)
    .limit(options.limit * 1)
    .skip((options.page - 1) * options.limit)
    .select('-__v');

  const total = await Deposit.countDocuments(query);
  const totalPages = Math.ceil(total / options.limit);

  res.status(200).json({
    success: true,
    data: {
      deposits,
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

// @desc    Get single deposit details
// @access  Private
const getDepositById = catchAsyncError(async (req, res, next) => {
  const deposit = await Deposit.findOne({
    _id: req.params.id,
    userId: req.user._id
  }).populate('methodId', 'name networkCode address qrPath');

  if (!deposit) {
    return next(new ErrorHandler('Deposit not found', 404));
  }

  // Check if expired and update status
  if (deposit.status === 'pending' && new Date() > deposit.expiresAt) {
    deposit.status = 'expired';
    await deposit.save();
  }

  res.status(200).json({
    success: true,
    data: {
      deposit
    }
  });
});

// @desc    Cancel deposit request
// @access  Private
const cancelDeposit = catchAsyncError(async (req, res, next) => {
  const deposit = await Deposit.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!deposit) {
    return next(new ErrorHandler('Deposit not found', 404));
  }

  // Only allow canceling pending deposits
  if (deposit.status !== 'pending') {
    return next(new ErrorHandler('Can only cancel pending deposits', 400));
  }

  deposit.status = 'expired';
  await deposit.save();

  res.status(200).json({
    success: true,
    message: 'Deposit request cancelled successfully',
    data: {
      depositId: deposit._id,
      status: deposit.status
    }
  });
});

// @desc    Get all deposits (admin)
// @access  Private (Admin)
const getAllDeposits = catchAsyncError(async (req, res, next) => {
  const { page = 1, limit = 20, status, userId } = req.query;
  
  const query = {};
  if (status) query.status = status;
  if (userId) query.userId = userId;

  const deposits = await Deposit.find(query)
    .populate('userId', 'phone')
    .populate('methodId', 'name networkCode')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('-__v');

  const total = await Deposit.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    success: true,
    data: {
      deposits,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords: total
      }
    }
  });
});

// @desc    Update deposit status (admin)
// @access  Private (Admin)
const updateDepositStatus = catchAsyncError(async (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'awaiting_txid', 'processing', 'completed', 'failed', 'expired'];
  
  if (!validStatuses.includes(status)) {
    return next(new ErrorHandler('Invalid status', 400));
  }

  const deposit = await Deposit.findById(req.params.id)
    .populate('userId', 'phone balance');

  if (!deposit) {
    return next(new ErrorHandler('Deposit not found', 404));
  }

  const oldStatus = deposit.status;
  deposit.status = status;

  // If deposit is completed, convert INR to USDT and add to user balance
  if (status === 'completed' && oldStatus !== 'completed') {
    const user = await User.findById(deposit.userId._id);
    if (user) {
      // Get current exchange rate
      let rateDoc = await ExchangeRate.findOne().sort({ createdAt: -1 });
      
      if (!rateDoc) {
        return next(new ErrorHandler('Exchange rate not available', 500));
      }

      const exchangeRate = rateDoc.dollarRate;
      
      // Convert INR deposit amount to USDT
      // Formula: USDT = INR / exchangeRate
      const usdtAmount = deposit.amount / exchangeRate;
      
      // Add USDT equivalent to user balance
      user.balance += usdtAmount;
      await user.save();

      // Create transaction record
      const transaction = new Transaction({
        userId: user._id,
        type: 'deposit',
        amount: usdtAmount, // Store USDT amount in transaction
        status: 'completed'
      });
      await transaction.save();
    }
  }

  await deposit.save();

  res.status(200).json({
    success: true,
    message: 'Deposit status updated successfully',
    data: {
      deposit,
      oldStatus,
      newStatus: status
    }
  });
});

module.exports = {
  getDepositMethods,
  createDeposit,
  submitTxid,
  getDepositHistory,
  getDepositById,
  cancelDeposit,
  getAllDeposits,
  updateDepositStatus
};