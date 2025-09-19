const https = require('https');
const ExchangeRate = require('../models/ExchangeRate');
const { ExchangeMethod, Exchange } = require('../models/Exchange');
const User = require('../models/User');
const catchAsyncError = require('../utils/catchAsyncError');
const { ErrorHandler } = require('../utils/ErrorHandler');

// @desc    Get current exchange rate
// @access  Public
const getCurrentRate = catchAsyncError(async (req, res, next) => {
  let rate = await ExchangeRate.findOne().sort({ createdAt: -1 });
  
  if (!rate) {
    // Create default rate if none exists
    rate = new ExchangeRate({
      dollarRate: 85.0
    });
    await rate.save();
  }

  res.status(200).json({
    success: true,
    data: {
      rate: rate.dollarRate,
      lastUpdated: rate.updatedAt
    }
  });
});

// @desc    Update exchange rate (admin only)
// @access  Private (Admin)
const updateRate = catchAsyncError(async (req, res, next) => {
  const { dollarRate } = req.body;
  
  if (!dollarRate || typeof dollarRate !== 'number' || dollarRate <= 0) {
    return next(new ErrorHandler('Valid dollar rate is required', 400));
  }

  let rate = await ExchangeRate.findOne().sort({ createdAt: -1 });
  
  if (!rate) {
    rate = new ExchangeRate({
      dollarRate,
      updatedBy: req.admin.email || 'admin'
    });
  } else {
    rate.dollarRate = dollarRate;
    rate.updatedBy = req.admin.email || 'admin';
  }

  await rate.save();

  res.status(200).json({
    success: true,
    message: 'Exchange rate updated successfully',
    data: {
      rate: rate.dollarRate,
      lastUpdated: rate.updatedAt
    }
  });
});

// @desc    Fetch and update exchange rate from CoinGecko API
// @access  Private (Admin)
const updateRateFromCoinGecko = catchAsyncError(async (req, res, next) => {
  try {
    // Fetch USDT to INR rate from CoinGecko
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=inr';
    
    https.get(url, (apiRes) => {
      let data = '';
      
      apiRes.on('data', (chunk) => {
        data += chunk;
      });
      
      apiRes.on('end', async () => {
        try {
          const result = JSON.parse(data);
          const newRate = result.tether.inr;
          
          if (!newRate || typeof newRate !== 'number') {
            return next(new ErrorHandler('Failed to fetch valid exchange rate from CoinGecko', 500));
          }
          
          // Update the rate in database
          let rate = await ExchangeRate.findOne().sort({ createdAt: -1 });
          
          if (!rate) {
            rate = new ExchangeRate({
              dollarRate: newRate,
              updatedBy: req.admin.email || 'CoinGecko API'
            });
          } else {
            rate.dollarRate = newRate;
            rate.updatedBy = req.admin.email || 'CoinGecko API';
          }
          
          await rate.save();
          
          res.status(200).json({
            success: true,
            message: 'Exchange rate updated successfully from CoinGecko',
            data: {
              rate: rate.dollarRate,
              lastUpdated: rate.updatedAt,
              source: 'CoinGecko'
            }
          });
        } catch (error) {
          return next(new ErrorHandler('Failed to parse exchange rate data: ' + error.message, 500));
        }
      });
    }).on('error', (error) => {
      return next(new ErrorHandler('Failed to fetch exchange rate from CoinGecko: ' + error.message, 500));
    });
  } catch (error) {
    return next(new ErrorHandler('Unexpected error while fetching exchange rate: ' + error.message, 500));
  }
});

// @desc    Get user's exchange methods (bank accounts)
// @access  Private
const getExchangeMethods = catchAsyncError(async (req, res, next) => {
  const methods = await ExchangeMethod.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .select('-__v');

  res.status(200).json({
    success: true,
    data: {
      methods
    }
  });
});

// @desc    Add new exchange method (bank account)
// @access  Private
const addExchangeMethod = catchAsyncError(async (req, res, next) => {
  const { bankName, accountNo, ifscCode, accountName } = req.body;
  
  // Validation
  if (!bankName || !accountNo || !ifscCode || !accountName) {
    return next(new ErrorHandler('All fields are required', 400));
  }

  // Basic validation
  if (accountNo.length < 5) {
    return next(new ErrorHandler('Account number is too short', 400));
  }

  if (ifscCode.length < 11) {
    return next(new ErrorHandler('IFSC code is too short', 400));
  }

  // Check if account already exists for this user
  const existingMethod = await ExchangeMethod.findOne({
    userId: req.user._id,
    accountNo
  });

  if (existingMethod) {
    return next(new ErrorHandler('Bank account already exists', 400));
  }

  const method = new ExchangeMethod({
    userId: req.user._id,
    bankName: bankName.trim(),
    accountNo: accountNo.trim(),
    ifscCode: ifscCode.trim().toUpperCase(),
    accountName: accountName.trim()
  });

  await method.save();

  res.status(201).json({
    success: true,
    message: 'Bank account added successfully',
    data: {
      method
    }
  });
});

// @desc    Delete exchange method
// @access  Private
const deleteExchangeMethod = catchAsyncError(async (req, res, next) => {
  const method = await ExchangeMethod.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!method) {
    return next(new ErrorHandler('Bank account not found', 404));
  }

  await ExchangeMethod.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Bank account deleted successfully'
  });
});

// @desc    Create new exchange (USDT to INR)
// @access  Private
const createExchange = catchAsyncError(async (req, res, next) => {
  const { methodId, usdtAmount } = req.body;
  // Validation
  if (!methodId || !usdtAmount || usdtAmount <= 0) {
    return next(new ErrorHandler('Method ID and valid USDT amount are required', 400));
  }

  // Check if method exists and belongs to user
  const method = await ExchangeMethod.findOne({
    _id: methodId,
    userId: req.user._id
  });

  if (!method) {
    return next(new ErrorHandler('Bank account not found', 404));
  }

  // Get current exchange rate
  let rateDoc = await ExchangeRate.findOne().sort({ createdAt: -1 });
  
  if (!rateDoc) {
    return next(new ErrorHandler('Exchange rate not available', 500));
  }

  const rate = rateDoc.dollarRate;
  const inrAmount = usdtAmount * rate;

  // Check if user has sufficient balance
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ErrorHandler('User not found', 404));
  }

  if (user.balance < usdtAmount) {
    return next(new ErrorHandler('Insufficient USDT balance', 400));
  }
  const exchange = new Exchange({
    userId: req.user._id,
    methodId,
    usdtAmount,
    amount: inrAmount,
    fee: 0,
    status: 'pending'
  });

  await exchange.save();

  // Populate method details
  await exchange.populate('methodId', 'bankName accountNo ifscCode accountName');

  res.status(201).json({
    success: true,
    message: 'Exchange request created successfully',
    data: {
      exchange: {
        id: exchange._id,
        usdtAmount: exchange.usdtAmount,
        inrAmount: exchange.amount,
        rate: rate,
        status: exchange.status,
        method: exchange.methodId,
        createdAt: exchange.createdAt
      }
    }
  });
});

// @desc    Get user's exchange history
// @access  Private
const getExchangeHistory = catchAsyncError(async (req, res, next) => {
  const { page = 1, limit = 10, status } = req.query;
  
  // Log for debugging
  console.log('Exchange history request for user:', req.user._id);
  console.log('Query parameters:', { page, limit, status });
  
  const query = { userId: req.user._id };
  if (status) {
    query.status = status;
  }
  
  console.log('Database query:', JSON.stringify(query));

  const exchanges = await Exchange.find(query)
    .populate('methodId', 'bankName accountNo')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('-__v');

  const total = await Exchange.countDocuments(query);
  const totalPages = Math.ceil(total / limit);
  
  console.log(`Found ${exchanges.length} exchanges out of ${total} total`);

  res.status(200).json({
    success: true,
    data: {
      exchanges,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords: total
      }
    }
  });
});

// @desc    Update exchange status (admin)
// @access  Private (Admin)
const updateExchangeStatus = catchAsyncError(async (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'completed', 'failed'];
  
  if (!validStatuses.includes(status)) {
    return next(new ErrorHandler('Invalid status', 400));
  }

  const exchange = await Exchange.findById(req.params.id)
    .populate('userId', 'phone balance');

  if (!exchange) {
    return next(new ErrorHandler('Exchange not found', 404));
  }

  const oldStatus = exchange.status;
  const newStatus = status;
  exchange.status = newStatus;

  // If status is changing from 'pending' to 'completed', deduct the user's balance
  if (oldStatus === 'pending' && newStatus === 'completed') {
    try {
      // Deduct the USDT amount from the user's balance
      const user = await User.findById(exchange.userId);
      if (user) {
        // Check if user has sufficient balance
        if (user.balance < exchange.usdtAmount) {
          return next(new ErrorHandler('Insufficient USDT balance', 400));
        }
        
        user.balance -= exchange.usdtAmount;
        await user.save();
        
        console.log(`Deducted ${exchange.usdtAmount} USDT from user ${user.phone} for completed exchange`);
      }
    } catch (error) {
      console.error('Error deducting user balance:', error);
      return next(new ErrorHandler('Failed to deduct user balance: ' + error.message, 500));
    }
  }
  
  // If status is changing from 'completed' to 'failed', refund the user's balance
  // This would happen if an admin mistakenly approved an exchange and then changed it to failed
  if (oldStatus === 'completed' && newStatus === 'failed') {
    try {
      // Add the USDT amount back to the user's balance
      const user = await User.findById(exchange.userId);
      if (user) {
        user.balance += exchange.usdtAmount;
        await user.save();
        
        console.log(`Refunded ${exchange.usdtAmount} USDT to user ${user.phone} due to failed exchange`);
      } else {
        return next(new ErrorHandler('User not found for refund', 404));
      }
    } catch (error) {
      console.error('Error refunding user balance:', error);
      return next(new ErrorHandler('Failed to refund user balance: ' + error.message, 500));
    }
  }
  
  // If status is changing from 'failed' to 'completed', deduct the user's balance
  if (oldStatus === 'failed' && newStatus === 'completed') {
    try {
      // Deduct the USDT amount from the user's balance
      const user = await User.findById(exchange.userId);
      if (user) {
        // Check if user has sufficient balance
        if (user.balance < exchange.usdtAmount) {
          return next(new ErrorHandler('Insufficient USDT balance', 400));
        }
        
        user.balance -= exchange.usdtAmount;
        await user.save();
        
        console.log(`Deducted ${exchange.usdtAmount} USDT from user ${user.phone} for completed exchange`);
      } else {
        return next(new ErrorHandler('User not found for balance deduction', 404));
      }
    } catch (error) {
      console.error('Error deducting user balance:', error);
      return next(new ErrorHandler('Failed to deduct user balance: ' + error.message, 500));
    }
  }
  
  // If status is changing from 'failed' to 'pending', do nothing
  if (oldStatus === 'failed' && newStatus === 'pending') {
    // Do nothing as requested
  }



  await exchange.save();

  res.status(200).json({
    success: true,
    message: 'Exchange status updated successfully',
    data: {
      exchange,
      oldStatus,
      newStatus
    }
  });
});

// @desc    Get all exchanges (admin)
// @access  Private (Admin)
const getAllExchanges = catchAsyncError(async (req, res, next) => {
  const { page = 1, limit = 20, status, userId } = req.query;
  
  const query = {};
  if (status) query.status = status;
  if (userId) query.userId = userId;

  const exchanges = await Exchange.find(query)
    .populate('userId', 'phone')
    .populate('methodId', 'bankName accountNo ifscCode')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('-__v');

  const total = await Exchange.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    success: true,
    data: {
      exchanges,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords: total
      }
    }
  });
});

// @desc    Get user's current balance
// @access  Private
const getCurrentBalance = catchAsyncError(async (req, res, next) => {
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

module.exports = {
  getCurrentRate,
  updateRate,
  updateRateFromCoinGecko,
  getExchangeMethods,
  addExchangeMethod,
  deleteExchangeMethod,
  createExchange,
  getExchangeHistory,
  updateExchangeStatus,
  getAllExchanges,
  getCurrentBalance
};