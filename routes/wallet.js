const express = require('express');
const { 
  getWallets,
  addWallet,
  deleteWallet,
  updateWallet,
  getWalletById,
  getWalletSummary,
  validateWallet
} = require('../controllers/walletController');
const { authenticateUser } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/wallet/list
// @desc    Get user's saved wallets
// @access  Private
router.get('/list', authenticateUser, getWallets);

// @route   POST /api/wallet/add
// @desc    Add new wallet address
// @access  Private
router.post('/add', authenticateUser, addWallet);

// @route   DELETE /api/wallet/:id
// @desc    Delete wallet address
// @access  Private
router.delete('/:id', authenticateUser, validateObjectId('id'), deleteWallet);

// @route   PUT /api/wallet/:id
// @desc    Update wallet address
// @access  Private
router.put('/:id', authenticateUser, validateObjectId('id'), updateWallet);

// @route   GET /api/wallet/:id
// @desc    Get single wallet details
// @access  Private
router.get('/:id', authenticateUser, validateObjectId('id'), getWalletById);

// @route   GET /api/wallet/methods/summary
// @desc    Get summary of wallets by method
// @access  Private
router.get('/methods/summary', authenticateUser, getWalletSummary);

// @route   POST /api/wallet/validate
// @desc    Validate wallet address format
// @access  Private
router.post('/validate', authenticateUser, validateWallet);

module.exports = router;