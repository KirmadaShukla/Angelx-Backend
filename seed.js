const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Admin = require('./models/Admin');
const ExchangeRate = require('./models/ExchangeRate');
const DepositMethod = require('./models/DepositMethod');

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/angelx', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');

    // Create admin user
    const adminExists = await Admin.findOne({ email: 'admin@angelx.com' });
    if (!adminExists) {
      const admin = new Admin({
        email: 'admin@angelx.com',
        password: 'admin123' // This will be hashed automatically
      });
      await admin.save();
      console.log('Admin user created: admin@angelx.com / admin123');
    }

    // Set default exchange rate
    const rateExists = await ExchangeRate.findOne();
    if (!rateExists) {
      const rate = new ExchangeRate({
        dollarRate: 83.5,
        updatedBy: 'system'
      });
      await rate.save();
      console.log('Default exchange rate set: 83.5');
    }

    // Create deposit methods
    const methodExists = await DepositMethod.findOne();
    if (!methodExists) {
      const methods = [
        {
          name: 'USDT',
          networkCode: 'TRC20',
          address: 'TQRcfuqvkJT6YtnHjFxzYrLhRuWyiphqTs',
          isActive: true
        },
        {
          name: 'BTC',
          networkCode: 'BTC',
          address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
          isActive: true
        }
      ];

      await DepositMethod.insertMany(methods);
      console.log('Deposit methods created');
    }

    console.log('Seed data completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed data error:', error);
    process.exit(1);
  }
};

seedData();