const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getWidgets,
  createWidget,
  updateWidget,
  deleteWidget,
  reorderWidgets,
} = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Dashboard statistics
router.get('/stats', getDashboardStats);

// Widget management
router.get('/widgets', getWidgets);
router.post('/widgets', createWidget);
router.put('/widgets/reorder', reorderWidgets);
router.put('/widgets/:id', updateWidget);
router.delete('/widgets/:id', deleteWidget);

module.exports = router;