const express = require('express');
const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const userRoutes = require('./userRoutes');
const transactionRoutes = require('./transactionRoutes');

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/transactions', transactionRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

module.exports = router;