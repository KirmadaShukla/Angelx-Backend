const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  methodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DepositMethod',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  txid: {
    type: String,
    default: null,
    maxlength: 160
  },
  status: {
    type: String,
    enum: ['pending', 'awaiting_txid', 'processing', 'completed', 'failed', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Indexes
depositSchema.index({ userId: 1 });
depositSchema.index({ status: 1 });
depositSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Deposit', depositSchema);