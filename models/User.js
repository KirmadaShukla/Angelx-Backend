const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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
  },
  transactionPassword: {
    type: String,
    minlength: 6,
    maxlength: 6,
    select: false // Don't include in queries by default
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

// Compare transaction password
userSchema.methods.compareTransactionPassword = async function(enteredPassword) {
  if (!this.transactionPassword) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.transactionPassword);
};

// Hash transaction password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('transactionPassword')) {
    next();
  }
  
  if (this.transactionPassword) {
    this.transactionPassword = await bcrypt.hash(this.transactionPassword, 12);
  }
});

// Index for phone number
userSchema.index({ phone: 1 });

module.exports = mongoose.model('User', userSchema);