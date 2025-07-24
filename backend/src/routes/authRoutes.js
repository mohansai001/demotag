const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateUser } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', validateUser.register, authController.register);
router.post('/login', validateUser.login, authController.login);

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, validateUser.updateProfile, authController.updateProfile);
router.post('/change-password', authenticateToken, validateUser.changePassword, authController.changePassword);
router.post('/logout', authenticateToken, authController.logout);
router.get('/verify', authenticateToken, authController.verifyToken);

module.exports = router;