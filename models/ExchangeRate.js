const mongoose = require('mongoose');

const exchangeRateSchema = new mongoose.Schema({
  dollarRate: {
    type: Number,
    required: true,
    min: 0
  },
  updatedBy: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ExchangeRate', exchangeRateSchema);