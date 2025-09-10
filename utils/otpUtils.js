const crypto = require('crypto');
const OtpSession = require('../models/OtpSession');

// Generate a random 6-digit OTP
const generateOTP = () => {
  // Generate a random 6-digit number
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Alternative method using crypto for better randomness
const generateSecureOTP = () => {
  // Generate 6 random digits using crypto
  let otp = '';
  for (let i = 0; i < 6; i++) {
    otp += crypto.randomInt(0, 10);
  }
  return otp;
};

// Save OTP session with session ID in database
const saveOTPSession = async (phone, sessionId, otp = null) => {
  try {
    // Delete any existing sessions for this phone number
    await OtpSession.deleteMany({ phone });
    
    // Create new OTP session
    const otpSession = new OtpSession({
      phone,
      sessionId,
      otp // This might be null if using external OTP service like 2Factor
    });
    
    await otpSession.save();
    return otpSession;
  } catch (error) {
    throw new Error('Failed to save OTP session: ' + error.message);
  }
};

// Get OTP session by phone number
const getOTPSession = async (phone) => {
  try {
    return await OtpSession.findOne({ phone });
  } catch (error) {
    throw new Error('Failed to retrieve OTP session: ' + error.message);
  }
};

// Delete OTP session by phone number
const deleteOTPSession = async (phone) => {
  try {
    return await OtpSession.deleteMany({ phone });
  } catch (error) {
    throw new Error('Failed to delete OTP session: ' + error.message);
  }
};

// Verify if session exists and hasn't expired
const verifyOTPSession = async (phone) => {
  try {
    const session = await OtpSession.findOne({ phone });
    
    if (!session) {
      return { valid: false, message: 'OTP session not found or expired' };
    }
    
    // Check if session has expired (5 minutes)
    const now = Date.now();
    const sessionCreatedAt = new Date(session.createdAt).getTime();
    const expirationTime = sessionCreatedAt + 5 * 60 * 1000; // 5 minutes
    
    if (now > expirationTime) {
      // Clean up expired session
      await OtpSession.deleteMany({ phone });
      return { valid: false, message: 'OTP session has expired' };
    }
    
    return { valid: true, session, message: 'OTP session is valid' };
  } catch (error) {
    throw new Error('Failed to verify OTP session: ' + error.message);
  }
};

module.exports = {
  generateOTP,
  generateSecureOTP,
  saveOTPSession,
  getOTPSession,
  deleteOTPSession,
  verifyOTPSession
};