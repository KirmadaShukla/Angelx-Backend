const mongoose = require('mongoose');

const depositMethodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  networkCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  qrCode: {
    url: {
      type: String,
      default: null
    },
    publicId: {
      type: String,
      default: null
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DepositMethod', depositMethodSchema);