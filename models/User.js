const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v); // 10 digit phone validation
      },
      message: 'Phone must be 10 digits'
    }
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Generate JWT token
userSchema.methods.getJwtToken = function() {
  return jwt.sign({ id: this._id, type: 'user' }, process.env.JWT_SECRET || 'angelx-secret-key-2024', {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Index for phone number
userSchema.index({ phone: 1 });

module.exports = mongoose.model('User', userSchema);