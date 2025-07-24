const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
} = require('../validators/authValidators');

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected routes
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, updateProfileValidation, updateProfile);
router.put('/password', verifyToken, changePasswordValidation, changePassword);

module.exports = router;