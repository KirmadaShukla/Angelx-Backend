const mongoose = require('mongoose');

const withdrawSchema = new mongoose.Schema({
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
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  network: {
    type: String,
    default: 'TRC20'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Index for user queries
withdrawSchema.index({ userId: 1 });
withdrawSchema.index({ status: 1 });

module.exports = mongoose.model('Withdraw', withdrawSchema);