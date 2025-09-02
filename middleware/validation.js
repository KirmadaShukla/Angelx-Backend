// Validation middleware
const mongoose = require('mongoose');
const catchAsyncError = require('../utils/catchAsyncError');
const { ErrorHandler } = require('../utils/ErrorHandler');

const validatePhoneNumber = catchAsyncError(async (req, res, next) => {
  const { phone } = req.body;
  
  if (!phone || !/^\d{10}$/.test(phone.toString().trim())) {
    return next(new ErrorHandler('Phone number must be exactly 10 digits', 400));
  }
  
  req.body.phone = phone.toString().trim();
  next();
});

const validateAmount = catchAsyncError(async (req, res, next) => {
  const { amount } = req.body;
  
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return next(new ErrorHandler('Amount must be a positive number', 400));
  }
  
  next();
});

// Custom validation for exchange USDT amount
const validateUsdtAmount = catchAsyncError(async (req, res, next) => {
  const { usdtAmount } = req.body;
  
  if (!usdtAmount || typeof usdtAmount !== 'number' || usdtAmount <= 0) {
    return next(new ErrorHandler('USDT amount must be a positive number', 400));
  }
  
  next();
});

const validateObjectId = (paramName = 'id') => {
  return catchAsyncError(async (req, res, next) => {
    const id = req.params[paramName];
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ErrorHandler(`Invalid ${paramName} format`, 400));
    }
    
    next();
  });
};

const validatePagination = catchAsyncError(async (req, res, next) => {
  let { page = 1, limit = 10 } = req.query;
  
  page = parseInt(page);
  limit = parseInt(limit);
  
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1 || limit > 100) limit = 10;
  
  req.query.page = page;
  req.query.limit = limit;
  
  next();
});

module.exports = {
  validatePhoneNumber,
  validateAmount,
  validateUsdtAmount,
  validateObjectId,
  validatePagination
};