const express = require('express');
const { 
  registerAdmin,
  adminLogin,
  adminLogout,
  getAdminDashboard,
  getAllUsers,
  updateUserBalance,
  updateWhatsAppNumber,
  getAdminProfile,
  createDepositMethod,
  getDepositMethods,
  updateDepositMethod,
  deleteDepositMethod
} = require('../controllers/adminController');
const { getDepositMethods: getDepositMethodsForAdmin } = require('../controllers/depositController');
const { authenticateAdmin } = require('../middleware/auth');
const { validateAmount, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/admin/register
// @desc    Register initial admin user
// @access  Public
router.post('/register', registerAdmin);

// @route   POST /api/admin/login
// @desc    Admin login
// @access  Public
router.post('/login', adminLogin);

// @route   POST /api/admin/logout
// @desc    Admin logout
// @access  Private (Admin)
router.post('/logout', authenticateAdmin, adminLogout);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard data
// @access  Private (Admin)
router.get('/dashboard', authenticateAdmin, getAdminDashboard);

// @route   GET /api/admin/profile
// @desc    Get admin profile
// @access  Private (Admin)
router.get('/profile', authenticateAdmin, getAdminProfile);

// @route   PUT /api/admin/whatsapp-number
// @desc    Update admin WhatsApp number
// @access  Private (Admin)
router.put('/whatsapp-number', authenticateAdmin, updateWhatsAppNumber);

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Private (Admin)
router.get('/users', authenticateAdmin, validatePagination, getAllUsers);

// @route   PUT /api/admin/users/:id/balance
// @desc    Update user balance
// @access  Private (Admin)
router.put('/users/:id/balance', authenticateAdmin, validateObjectId('id'), updateUserBalance);

// @route   POST /api/admin/deposit-methods
// @desc    Create new deposit method
// @access  Private (Admin)
router.post('/deposit-methods', authenticateAdmin, createDepositMethod);

// @route   GET /api/admin/deposit-methods
// @desc    Get all deposit methods
// @access  Private (Admin)
router.get('/deposit-methods', authenticateAdmin, getDepositMethodsForAdmin);

// @route   PUT /api/admin/deposit-methods/:id
// @desc    Update deposit method
// @access  Private (Admin)
router.put('/deposit-methods/:id', authenticateAdmin, validateObjectId('id'), updateDepositMethod);

// @route   DELETE /api/admin/deposit-methods/:id
// @desc    Delete deposit method
// @access  Private (Admin)
router.delete('/deposit-methods/:id', authenticateAdmin, validateObjectId('id'), deleteDepositMethod);

module.exports = router;