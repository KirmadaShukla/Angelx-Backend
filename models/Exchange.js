const mongoose = require('mongoose');

const exchangeMethodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bankName: {
    type: String,
    trim: true
  },
  accountNo: {
    type: String,
    required: true,
    trim: true
  },
  ifscCode: {
    type: String,
    required: true,
    trim: true
  },
  accountName: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

exchangeMethodSchema.index({ userId: 1 });

const exchangeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  methodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExchangeMethod',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  usdtAmount: {
    type: Number,
    required: true,
    min: 0
  },
  fee: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

exchangeSchema.index({ userId: 1 });
exchangeSchema.index({ status: 1 });

const ExchangeMethod = mongoose.model('ExchangeMethod', exchangeMethodSchema);
const Exchange = mongoose.model('Exchange', exchangeSchema);

module.exports = { ExchangeMethod, Exchange };