const express = require('express');
const { 
  getDepositMethods, 
  createDeposit, 
  submitTxid, 
  getDepositHistory,
  getDepositById,
  cancelDeposit,
  getAllDeposits,
  updateDepositStatus
} = require('../controllers/depositController');
const { authenticateUser, authenticateAdmin } = require('../middleware/auth');
const { validateAmount, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/deposit/methods
// @desc    Get all active deposit methods
// @access  Public
router.get('/methods', getDepositMethods);

// @route   POST /api/deposit/create
// @desc    Create new deposit request
// @access  Private
router.post('/create', authenticateUser, validateAmount, createDeposit);

// @route   POST /api/deposit/submit-txid
// @desc    Submit transaction ID for deposit
// @access  Private
router.post('/submit-txid', authenticateUser, submitTxid);

// @route   GET /api/deposit/history
// @desc    Get user's deposit history
// @access  Private
router.get('/history', authenticateUser, validatePagination, getDepositHistory);

// @route   GET /api/deposit/:id
// @desc    Get single deposit details
// @access  Private
router.get('/:id', authenticateUser, validateObjectId('id'), getDepositById);

// @route   POST /api/deposit/cancel/:id
// @desc    Cancel deposit request
// @access  Private
router.post('/cancel/:id', authenticateUser, validateObjectId('id'), cancelDeposit);

// Admin routes for deposit management

// @route   GET /api/deposit/admin/all
// @desc    Get all deposits (admin)
// @access  Private (Admin)
router.get('/admin/all', authenticateAdmin, validatePagination, getAllDeposits);

// @route   PUT /api/deposit/admin/update-status/:id
// @desc    Update deposit status (admin)
// @access  Private (Admin)
router.put('/admin/update-status/:id', authenticateAdmin, validateObjectId('id'), updateDepositStatus);

module.exports = router;