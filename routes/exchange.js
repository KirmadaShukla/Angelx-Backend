const express = require('express');
const { 
  getCurrentRate, 
  updateRate, 
  updateRateFromCoinGecko,
  getExchangeMethods, 
  addExchangeMethod, 
  deleteExchangeMethod,
  createExchange,
  getExchangeHistory
} = require('../controllers/exchangeController');
const { authenticateUser, authenticateAdmin } = require('../middleware/auth');
const { validateAmount, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/exchange/rate
// @desc    Get current exchange rate
// @access  Public
router.get('/rate', getCurrentRate);

// @route   POST /api/exchange/rate
// @desc    Update exchange rate (admin only)
// @access  Private (Admin)
router.post('/rate', authenticateAdmin, updateRate);

// @route   POST /api/exchange/rate/coingecko
// @desc    Fetch and update exchange rate from CoinGecko API (admin only)
// @access  Private (Admin)
router.post('/rate/coingecko', authenticateAdmin, updateRateFromCoinGecko);

// @route   GET /api/exchange/methods
// @desc    Get user's exchange methods (bank accounts)
// @access  Private
router.get('/methods', authenticateUser, getExchangeMethods);

// @route   POST /api/exchange/methods
// @desc    Add new exchange method (bank account)
// @access  Private
router.post('/methods', authenticateUser, addExchangeMethod);

// @route   DELETE /api/exchange/methods/:id
// @desc    Delete exchange method
// @access  Private
router.delete('/methods/:id', authenticateUser, validateObjectId('id'), deleteExchangeMethod);

// @route   POST /api/exchange/create
// @desc    Create new exchange (USDT to INR)
// @access  Private
router.post('/create', authenticateUser, validateAmount, createExchange);

// @route   GET /api/exchange/history
// @desc    Get user's exchange history
// @access  Private
router.get('/history', authenticateUser, validatePagination, getExchangeHistory);

module.exports = router;