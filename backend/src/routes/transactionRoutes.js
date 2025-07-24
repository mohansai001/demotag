const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All transaction routes require authentication
router.use(authenticateToken);

// Placeholder routes - implement as needed
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Transaction routes - to be implemented' });
});

module.exports = router;