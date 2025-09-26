const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Wallet = require('../models/Wallet');

describe('Admin Withdrawal Limit API', () => {
  let adminToken, userToken, userId, walletId;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/angelx_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await Admin.deleteMany({});
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await mongoose.connection.close();
  });

  it('should register and login admin', async () => {
    // Register admin
    const registerRes = await request(app)
      .post('/api/v1/admin/register')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });
    
    expect(registerRes.status).toBe(201);
    
    // Login admin
    const loginRes = await request(app)
      .post('/api/v1/admin/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });
    
    expect(loginRes.status).toBe(200);
    adminToken = loginRes.body.token;
  });

  it('should set withdrawal limit', async () => {
    const res = await request(app)
      .put('/api/v1/admin/withdrawal-limit')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        limit: 5000
      });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.admin.withdrawalLimit).toBe(5000);
  });

  it('should get withdrawal limit', async () => {
    const res = await request(app)
      .get('/api/v1/admin/withdrawal-limit')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.withdrawalLimit).toBe(5000);
  });
});