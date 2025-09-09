const User = require('../models/User');
const { generateToken, maskPhone } = require('../middleware/auth');
const catchAsyncError = require('../utils/catchAsyncError');
const sendToken = require('../utils/sendToken');
const { ErrorHandler } = require('../utils/ErrorHandler');

// @desc    Send phone number for OTP verification
// @access  Public
const login = catchAsyncError(async (req, res, next) => {
  const { phone } = req.body;
  

  const cleanPhone = phone.trim();

  // In real implementation, you would send actual OTP here
  // For now, we'll just store phone in session-like response
  res.status(200).json({
    success: true,
    message: 'OTP verification initiated',
    data: {
      phone: cleanPhone,
      maskedPhone: maskPhone(cleanPhone),
      otp: '123456'
    }
  });
});

// @desc    Verify OTP and login/register user
// @access  Public
const verifyOtp = catchAsyncError(async (req, res, next) => {
  const { phone, otp } = req.body;
  


  if (!otp || otp.length !== 6) {
    return next(new ErrorHandler('Please enter a valid 6-digit OTP.', 400));
  }

  const cleanPhone = phone.trim();

  // In real implementation, verify OTP from cache/database
  // For now, accept any 6-digit OTP for testing
  if (!/^\d{6}$/.test(otp)) {
    return next(new ErrorHandler('Invalid OTP format.', 400));
  }

  // Check if user exists
  let user = await User.findOne({ phone: cleanPhone });
  
  if (!user) {
    // Create new user if doesn't exist
    user = new User({
      phone: cleanPhone,
      balance: 0
    });
    
    await user.save();
  }

  // Send token using sendToken utility
  sendToken(user, 200, res);
});

// @desc    Logout user
// @access  Private
const logout = catchAsyncError(async (req, res, next) => {
  res.cookie('token', null, {
    expires: new Date(Date.now()),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = {
  login,
  verifyOtp,
  logout
};