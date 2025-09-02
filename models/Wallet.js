const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  method: {
    type: String,
    enum: ['USDT', 'PAYX'],
    required: true
  },
  walletAddress: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Index for user queries
walletSchema.index({ userId: 1 });
walletSchema.index({ userId: 1, method: 1 });

module.exports = mongoose.model('Wallet', walletSchema);