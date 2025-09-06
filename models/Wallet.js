const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  currency: {
    type: String,
    enum: ['USDT', 'PAYX'],
    required: true
  },
  walletAddress: {
    type: String,
    required: true,
    trim: true
  },
  network: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for user queries
walletSchema.index({ userId: 1 });
walletSchema.index({ userId: 1, currency: 1 });

module.exports = mongoose.model('Wallet', walletSchema);