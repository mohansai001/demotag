const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');
const { validateQuery } = require('../middleware/validation');

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticateToken);

// Dashboard overview
router.get('/overview', dashboardController.getOverview);

// Revenue analytics
router.get('/revenue', validateQuery.dateRange, dashboardController.getRevenueAnalytics);

// Transaction analytics
router.get('/transactions', validateQuery.dateRange, dashboardController.getTransactionAnalytics);

// Metrics
router.get('/metrics', dashboardController.getMetrics);
router.get('/metrics/trends', dashboardController.getMetricTrends);

// Recent activity
router.get('/activity', dashboardController.getRecentActivity);

// Dashboard widgets
router.get('/widgets', dashboardController.getWidgets);

module.exports = router;