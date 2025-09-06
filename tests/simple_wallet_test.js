const Wallet = require('../models/Wallet');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/angelx', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Test wallet creation with new schema
async function testWalletCreation() {
  try {
    console.log('Testing wallet creation with new schema...');
    
    // Create a test wallet with PAYX currency
    const payxWallet = new Wallet({
      userId: new mongoose.Types.ObjectId(),
      currency: 'PAYX',
      walletAddress: '0xTestPayxWalletAddress123456789'
    });
    
    await payxWallet.save();
    console.log('✅ PAYX wallet created successfully');
    console.log('   Network set to:', payxWallet.network);
    
    // Create a test wallet with USDT currency
    const usdtWallet = new Wallet({
      userId: new mongoose.Types.ObjectId(),
      currency: 'USDT',
      walletAddress: '0xTestUsdtWalletAddress123456789'
    });
    
    await usdtWallet.save();
    console.log('✅ USDT wallet created successfully');
    console.log('   Network set to:', usdtWallet.network);
    
    // Test updating wallet currency
    usdtWallet.currency = 'PAYX';
    await usdtWallet.save();
    console.log('✅ Wallet currency updated successfully');
    console.log('   New network set to:', usdtWallet.network);
    
    // Clean up test wallets
    await Wallet.deleteMany({
      walletAddress: {
        $in: [
          '0xTestPayxWalletAddress123456789',
          '0xTestUsdtWalletAddress123456789'
        ]
      }
    });
    console.log('✅ Test wallets cleaned up');
    
    console.log('\n🎉 All tests passed! Wallet schema update is working correctly.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testWalletCreation();