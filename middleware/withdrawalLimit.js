const Admin = require('../models/Admin');
const { ErrorHandler } = require('../utils/ErrorHandler');
const catchAsyncError = require('../utils/catchAsyncError');

// Middleware to check withdrawal limit
const checkWithdrawalLimit = catchAsyncError(async (req, res, next) => {
  const { amount } = req.body;
  
  // Get admin to retrieve withdrawal limit
  const admin = await Admin.findOne();
  
  if (!admin) {
    return next(new ErrorHandler('Admin not found', 404));
  }
  
  // If withdrawal limit is 0, it means no limit
  if (admin.withdrawalLimit === 0) {
    return next();
  }
  
  // Check if withdrawal amount exceeds the limit
  if (amount > admin.withdrawalLimit) {
    return next(new ErrorHandler(`Withdrawal amount exceeds the limit of ${admin.withdrawalLimit}`, 400));
  }
  
  next();
});

module.exports = { checkWithdrawalLimit };