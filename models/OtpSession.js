const mongoose = require('mongoose');

const otpSessionSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    trim: true
  },
  otp: {
    type: String,
    required: false // Not required as 2Factor generates the OTP
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // Expire after 5 minutes (300 seconds)
  }
});

// Index for phone number and session ID for faster lookups
otpSessionSchema.index({ phone: 1 });
otpSessionSchema.index({ sessionId: 1 });

module.exports = mongoose.model('OtpSession', otpSessionSchema);