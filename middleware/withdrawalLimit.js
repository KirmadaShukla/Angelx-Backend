const Admin = require('../models/Admin');
const User = require('../models/User');
const { ErrorHandler } = require('../utils/ErrorHandler');
const catchAsyncError = require('../utils/catchAsyncError');

// Middleware to check withdrawal limit
const checkWithdrawalLimit = catchAsyncError(async (req, res, next) => {
  const { amount } = req.body;
  
  // First check user-specific limit
  const user = await User.findById(req.user._id);
  
  if (!user) {
    return next(new ErrorHandler('User not found', 404));
  }
  
  // If user has a specific limit set, check against that
  if (user.withdrawalLimit > 0 && amount > user.withdrawalLimit) {
    return next(new ErrorHandler(`Withdrawal amount exceeds your limit of ${user.withdrawalLimit}`, 400));
  }
  
  // If no user-specific limit, check global limit
  if (user.withdrawalLimit === 0) {
    const admin = await Admin.findOne();
    
    if (admin && admin.withdrawalLimit > 0 && amount > admin.withdrawalLimit) {
      return next(new ErrorHandler(`Withdrawal amount exceeds the limit of ${admin.withdrawalLimit}`, 400));
    }
  }
  
  next();
});

module.exports = { checkWithdrawalLimit };