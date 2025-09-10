const User = require('../models/User');
const OtpSession = require('../models/OtpSession');
const { maskPhone } = require('../middleware/auth');
const catchAsyncError = require('../utils/catchAsyncError');
const sendToken = require('../utils/sendToken');
const { ErrorHandler } = require('../utils/ErrorHandler');
const { sendOtp, verifyOtp } = require('../utils/otpVerification');
const { saveOTPSession, verifyOTPSession, deleteOTPSession, generateSecureOTP } = require('../utils/otpUtils');

// @desc    Send phone number for OTP verification
// @access  Public
const login = catchAsyncError(async (req, res, next) => {
  const { phone } = req.body;
  
  const cleanPhone = phone.trim();

  // Validate phone number
  if (!cleanPhone || !/^\d{10}$/.test(cleanPhone)) {
    return next(new ErrorHandler('Please enter a valid 10-digit phone number.', 400));
  }
    const apiKey = process.env.OTP_API_KEY;

  const otp =  generateSecureOTP();
  // Send OTP via 2Factor API (let 2Factor generate the OTP)
  
  // Check if API key is configured
  if (!apiKey) {
    console.error('OTP_API_KEY is not configured in environment variables');
    return next(new ErrorHandler('OTP service is not properly configured. Please contact administrator.', 500));
  }
  
  try {
 const result=await sendOtp(apiKey, cleanPhone,otp);
    console.log('2Factor API Response:',result.Status); // Log for debugging
    
    if (result.Status === 'Success') {
      // Save session ID 
      await saveOTPSession(cleanPhone, result.Details,otp);
      
      res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        data: {
          phone: cleanPhone,
          maskedPhone: maskPhone(cleanPhone)
        }
      });
    } else {
      console.error('2Factor API Error:');
      return next(new ErrorHandler('Failed to send OTP:', 500));
    }
  } catch (error) {
    console.error('Failed to send OTP:', error);
    return next(new ErrorHandler('Failed to send OTP: ' + error.message, 500));
  }
});

// @desc    Verify OTP and login/register user
// @access  Public
const verifyOtpController = catchAsyncError(async (req, res, next) => {
  const { phone, otp } = req.body;

  const cleanPhone = phone.trim();

  // Validate inputs
  if (!cleanPhone || !/^\d{10}$/.test(cleanPhone)) {
    return next(new ErrorHandler('Please enter a valid 10-digit phone number.', 400));
  }

  if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    return next(new ErrorHandler('Please enter a valid 6-digit OTP.', 400));
  }

  // Verify OTP session from database
  const sessionVerification = await verifyOTPSession(cleanPhone);
  if (!sessionVerification.valid) {
    return next(new ErrorHandler(sessionVerification.message, 400));
  }

  // Verify OTP via 2Factor API
  const apiKey = process.env.OTP_API_KEY ;
  
  // Check if API key is configured
  if (!apiKey) {
    console.warn('Using default OTP API key. This should be configured in environment variables.');
  }
  
  const sessionId = sessionVerification.session.sessionId;
  
  try {
    const result = await verifyOtp(apiKey, sessionId, otp);
    console.log('2Factor Verification Response:', result); // Log for debugging
    
    // Clean up session data
    await deleteOTPSession(cleanPhone);
    
    if (result.Status === 'Success' && result.Details === 'OTP Matched') {
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
    } else {
      console.error('2Factor Verification Error:', result);
      return next(new ErrorHandler('Invalid OTP or verification failed: ' + (result.Details || result.Message || 'Please try again'), 400));
    }
  } catch (error) {
    console.error('Failed to verify OTP:', error);
    // Clean up session data even on error
    await deleteOTPSession(cleanPhone);
    return next(new ErrorHandler('Failed to verify OTP: ' + error.message, 500));
  }
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

// @desc    Update transaction password
// @access  Private
const updateTransactionPassword = catchAsyncError(async (req, res, next) => {
  const { transactionPassword } = req.body;

  // Validate transaction password
  if (!transactionPassword || transactionPassword.length !== 6 || !/^\d{6}$/.test(transactionPassword)) {
    return next(new ErrorHandler('Transaction password must be exactly 6 digits', 400));
  }

  // Update user's transaction password
  const user = await User.findById(req.user._id);
  
  if (!user) {
    return next(new ErrorHandler('User not found', 404));
  }

  user.transactionPassword = transactionPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Transaction password updated successfully'
  });
});

module.exports = {
  login,
  verifyOtp: verifyOtpController,
  logout,
  updateTransactionPassword
};