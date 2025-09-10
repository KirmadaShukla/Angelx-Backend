// Utility functions for OTP verification with 2Factor API
const axios = require('axios');

/**
 * Send OTP via 2Factor API
 * @param {string} apiKey - 2Factor API Key
 * @param {string} phoneNumber - Phone number to send OTP to
 * @returns {Promise<object>} - API response
 */
const sendOtp = async (apiKey, phoneNumber,otp) => {
  // Validate inputs
  if (!apiKey) {
    throw new Error('OTP API key is missing. Please check your environment configuration.');
  }
  
  if (!phoneNumber) {
    throw new Error('Phone number is required');
  }
  
  try {
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/${phoneNumber}/${otp}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.log('Error sending OTP:', error);
  }
};

/**
 * Verify OTP via 2Factor API
 * @param {string} apiKey - 2Factor API Key
 * @param {string} sessionId - Session ID from send OTP response
 * @param {string} otp - OTP entered by user
 * @returns {Promise<object>} - API response
 */
const verifyOtp = async (apiKey, sessionId, otp) => {
  // Validate inputs
  if (!apiKey || !sessionId || !otp) {
    throw new Error('Missing required parameters for OTP verification');
  }
  
  try {
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${sessionId}/${otp}`;
    const response = await axios.get(url);
    

    return response.data;
  } catch (error) {
   console.error('Error verifying OTP:', error);
  }
};

module.exports = {
  sendOtp,
  verifyOtp
};