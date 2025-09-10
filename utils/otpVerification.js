const axios = require('axios');

/**
 * Send OTP via NINZA SMS API
 * @param {string} apiKey - NINZA SMS API Key
 * @param {string} phoneNumber - Phone number to send OTP to
 * @param {string} otp - OTP to send
 * @returns {Promise<object>} - API response
 */
const sendOtp = async (apiKey, phoneNumber, otp) => {
  // Validate inputs
  if (!apiKey) {
    throw new Error('OTP API key is missing. Please check your environment configuration.');
  }
  
  if (!phoneNumber) {
    throw new Error('Phone number is required');
  }
  
  if (!otp) {
    throw new Error('OTP is required');
  }

  try {
    const response = await axios.post('https://ninzasms.in.net/auth/send_sms', {
      sender_id: '15574',
      variables_values: otp,
      numbers: phoneNumber
    }, {
      headers: {
        'authorization': apiKey,
        'content-type': 'application/json'
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error sending OTP:', error.response?.data || error.message);
    throw new Error('Failed to send OTP: ' + (error.response?.data?.message || error.message));
  }
};

module.exports = {
  sendOtp,
};