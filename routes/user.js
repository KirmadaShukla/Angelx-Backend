const express = require('express');
const { 
  getProfile, 
  getBalance, 
  getDashboard,
  getTransactions,
  getUserStats
} = require('../controllers/userController');
const { authenticateUser } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/user/profile
// @desc    Get user profile information
// @access  Private
router.get('/profile', authenticateUser, getProfile);

// @route   GET /api/user/balance
// @desc    Get user balance
// @access  Private
router.get('/balance', authenticateUser, getBalance);

// @route   GET /api/user/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', authenticateUser, getDashboard);

// @route   GET /api/user/transactions
// @desc    Get user transaction history
// @access  Private
router.get('/transactions', authenticateUser, validatePagination, getTransactions);

// @route   GET /api/user/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', authenticateUser, getUserStats);

module.exports = router;
