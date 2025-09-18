const express = require('express');
const { login, verifyOtp, logout, updateTransactionPassword, getWhatsAppNumber } = require('../controllers/authController');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Send phone number for OTP verification
// @access  Public
router.post('/send-otp', login);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and login/register user
// @access  Public
router.post('/verify-otp', verifyOtp);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', logout);

// @route   PUT /api/auth/transaction-password
// @desc    Update transaction password
// @access  Private
router.put('/transaction-password', authenticateUser, updateTransactionPassword);

router.get('/getAdmin-whatsapp', getWhatsAppNumber)
module.exports = router;