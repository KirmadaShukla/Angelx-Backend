const Wallet = require('../models/Wallet');
const catchAsyncError = require('../utils/catchAsyncError');
const { ErrorHandler } = require('../utils/ErrorHandler');

// @desc    Get user's saved wallets
// @access  Private
const getWallets = catchAsyncError(async (req, res, next) => {
  const wallets = await Wallet.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .select('-__v');

  res.status(200).json({
    success: true,
    data: {
      wallets
    }
  });
});

// @desc    Add new wallet address
// @access  Private
const addWallet = catchAsyncError(async (req, res, next) => {
  const { method, walletAddress, network } = req.body;
  
  // Validation
  if (!method || !walletAddress) {
    return next(new ErrorHandler('Method and wallet address are required', 400));
  }

  // Validate method
  const validMethods = ['USDT', 'PAYX'];
  if (!validMethods.includes(method)) {
    return next(new ErrorHandler('Invalid method. Must be USDT or PAYX', 400));
  }

  // Validate address format (basic validation)
  if (walletAddress.length < 20) {
    return next(new ErrorHandler('Invalid wallet address', 400));
  }

  // Check if wallet already exists for this user
  const existingWallet = await Wallet.findOne({
    userId: req.user._id,
    method,
    walletAddress
  });

  if (existingWallet) {
    return next(new ErrorHandler('Wallet address already exists', 400));
  }

  const wallet = new Wallet({
    userId: req.user._id,
    method: method.toUpperCase(),
    walletAddress: walletAddress.trim(),
    network: network ? network.trim().toUpperCase() : null
  });

  await wallet.save();

  res.status(201).json({
    success: true,
    message: 'Wallet address added successfully',
    data: {
      wallet
    }
  });
});

// @desc    Delete wallet address
// @access  Private
const deleteWallet = catchAsyncError(async (req, res, next) => {
  const wallet = await Wallet.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!wallet) {
    return next(new ErrorHandler('Wallet not found', 404));
  }

  await Wallet.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Wallet address deleted successfully'
  });
});

// @desc    Update wallet address
// @access  Private
const updateWallet = catchAsyncError(async (req, res, next) => {
  const { walletAddress, network } = req.body;
  
  // Validation
  if (!walletAddress) {
    return next(new ErrorHandler('Wallet address is required', 400));
  }

  // Validate address format (basic validation)
  if (walletAddress.length < 20) {
    return next(new ErrorHandler('Invalid wallet address', 400));
  }

  const wallet = await Wallet.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!wallet) {
    return next(new ErrorHandler('Wallet not found', 404));
  }

  wallet.walletAddress = walletAddress.trim();
  if (network) {
    wallet.network = network.trim().toUpperCase();
  }

  await wallet.save();

  res.status(200).json({
    success: true,
    message: 'Wallet address updated successfully',
    data: {
      wallet
    }
  });
});

// @desc    Get single wallet details
// @access  Private
const getWalletById = catchAsyncError(async (req, res, next) => {
  const wallet = await Wallet.findOne({
    _id: req.params.id,
    userId: req.user._id
  }).select('-__v');

  if (!wallet) {
    return next(new ErrorHandler('Wallet not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      wallet
    }
  });
});

// @desc    Get summary of wallets by method
// @access  Private
const getWalletSummary = catchAsyncError(async (req, res, next) => {
  const summary = await Wallet.aggregate([
    { $match: { userId: req.user._id } },
    {
      $group: {
        _id: '$method',
        count: { $sum: 1 },
        networks: { $addToSet: '$network' }
      }
    },
    {
      $project: {
        method: '$_id',
        count: 1,
        networks: 1,
        _id: 0
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      summary
    }
  });
});

// @desc    Validate wallet address format
// @access  Private
const validateWallet = catchAsyncError(async (req, res, next) => {
  const { method, walletAddress } = req.body;
  
  // Validation
  if (!method || !walletAddress) {
    return next(new ErrorHandler('Method and wallet address are required', 400));
  }

  // Validate method
  const validMethods = ['USDT', 'PAYX'];
  if (!validMethods.includes(method)) {
    return next(new ErrorHandler('Invalid method. Must be USDT or PAYX', 400));
  }

  // Basic address validation
  let isValid = false;
  let message = '';

  if (method === 'USDT') {
    // USDT addresses are typically 34 characters for TRC20 or 42 characters for ERC20
    if (walletAddress.length === 34 || walletAddress.length === 42) {
      isValid = true;
    } else {
      message = 'USDT address should be 34 characters (TRC20) or 42 characters (ERC20)';
    }
  } else if (method === 'PAYX') {
    // PAYX validation (basic)
    if (walletAddress.length >= 20) {
      isValid = true;
    } else {
      message = 'PAYX address should be at least 20 characters';
    }
  }

  res.status(200).json({
    success: true,
    data: {
      isValid,
      message: isValid ? 'Valid address' : message
    }
  });
});

module.exports = {
  getWallets,
  addWallet,
  deleteWallet,
  updateWallet,
  getWalletById,
  getWalletSummary,
  validateWallet
};