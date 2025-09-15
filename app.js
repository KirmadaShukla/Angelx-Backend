const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const fileUpload = require('express-fileupload');
const path = require('path');
// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const exchangeRoutes = require('./routes/exchange');
const depositRoutes = require('./routes/deposit');
const withdrawRoutes = require('./routes/withdraw');
const walletRoutes = require('./routes/wallet');
const adminRoutes = require('./routes/admin');
const { generatedErrors } = require('./middleware/error');

// Middleware
app.use(cors({
  origin:['https://angelsx.co','http://localhost:8030'],
  credentials: true,
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('combined'));
app.use(fileUpload({
  createParentPath: true,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024 // 2MB max file size
  }
}));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/angelx', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/exchange', exchangeRoutes);
app.use('/api/v1/deposit', depositRoutes);
app.use('/api/v1/withdraw', withdrawRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'AngelX API is running' });
});

// Error handling middleware
app.use(generatedErrors);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`AngelX API server running on port ${PORT}`);
});