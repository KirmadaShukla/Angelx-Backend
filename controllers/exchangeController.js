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

  if (ifscCode.length < 5) {
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

  // Check user balance
  const user = await User.findById(req.user._id);
  
  if (user.balance < usdtAmount) {
    return next(new ErrorHandler('Insufficient USDT balance', 400));
  }

  // Deduct balance
  user.balance -= usdtAmount;
  await user.save();

  // Create exchange record
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
  
  const query = { userId: req.user._id };
  if (status) {
    query.status = status;
  }

  const exchanges = await Exchange.find(query)
    .populate('methodId', 'bankName accountNo')
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

module.exports = {
  getCurrentRate,
  updateRate,
  updateRateFromCoinGecko,
  getExchangeMethods,
  addExchangeMethod,
  deleteExchangeMethod,
  createExchange,
  getExchangeHistory
};