const express = require('express');
const { 
  createWithdrawal,
  getWithdrawalHistory,
  getWithdrawalById,
  cancelWithdrawal,
  getWithdrawalStats,
  getAllWithdrawals,
  updateWithdrawalStatus,
  getAdminWithdrawalStats
} = require('../controllers/withdrawController');
const { authenticateUser, authenticateAdmin } = require('../middleware/auth');
const { checkWithdrawalLimit } = require('../middleware/withdrawalLimit');
const { validateAmount, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/withdraw/create
// @desc    Create new withdrawal request
// @access  Private
router.post('/create', authenticateUser, validateAmount, createWithdrawal);

// @route   GET /api/withdraw/history
// @desc    Get user's withdrawal history
// @access  Private
router.get('/history', authenticateUser, validatePagination, getWithdrawalHistory);

// @route   GET /api/withdraw/:id
// @desc    Get single withdrawal details
// @access  Private
router.get('/:id', authenticateUser, validateObjectId('id'), getWithdrawalById);

// @route   POST /api/withdraw/cancel/:id
// @desc    Cancel withdrawal request (only if pending)
// @access  Private
router.post('/cancel/:id', authenticateUser, validateObjectId('id'), cancelWithdrawal);

// @route   GET /api/withdraw/stats/summary
// @desc    Get withdrawal statistics for user
// @access  Private
router.get('/stats/summary', authenticateUser, getWithdrawalStats);

// Admin routes for withdrawal management

// @route   GET /api/withdraw/admin/all
// @desc    Get all withdrawals (admin)
// @access  Private (Admin)
router.get('/admin/all', authenticateAdmin, getAllWithdrawals);

// @route   PUT /api/withdraw/admin/update-status/:id
// @desc    Update withdrawal status (admin)
// @access  Private (Admin)
router.put('/admin/update-status/:id', authenticateAdmin, validateObjectId('id'), updateWithdrawalStatus);

// @route   GET /api/withdraw/admin/stats
// @desc    Get withdrawal statistics (admin)
// @access  Private (Admin)
router.get('/admin/stats', authenticateAdmin, getAdminWithdrawalStats);

module.exports = router;