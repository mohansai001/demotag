const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const logger = require('../config/logger');

class AuthController {
  // Register new user
  async register(req, res) {
    try {
      const { email, password, first_name, last_name, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Create new user
      const userData = {
        email: email.toLowerCase(),
        password,
        first_name,
        last_name,
        role: role || 'user'
      };

      const user = await User.create(userData);
      const token = generateToken(user);

      logger.info('User registered successfully', { userId: user.id, email: user.email });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user,
          token
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration'
      });
    }
  }

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findByEmail(email.toLowerCase());
      if (!user) {
        logger.warn('Login attempt with non-existent email', { email, ip: req.ip });
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if user is active
      if (!user.is_active) {
        logger.warn('Login attempt with inactive account', { userId: user.id, ip: req.ip });
        return res.status(401).json({
          success: false,
          message: 'Account is inactive. Please contact support.'
        });
      }

      // Validate password
      const isValidPassword = await User.validatePassword(password, user.password);
      if (!isValidPassword) {
        logger.warn('Login attempt with invalid password', { userId: user.id, ip: req.ip });
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Update last login
      await User.updateLastLogin(user.id);

      // Generate token
      const { password: _, ...userWithoutPassword } = user;
      const token = generateToken(userWithoutPassword);

      logger.info('User logged in successfully', { userId: user.id, email: user.email });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userWithoutPassword,
          token
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login'
      });
    }
  }

  // Get current user profile
  async getProfile(req, res) {
    try {
      const user = await User.getProfile(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const { first_name, last_name, avatar_url } = req.body;
      
      const updateData = {};
      if (first_name) updateData.first_name = first_name;
      if (last_name) updateData.last_name = last_name;
      if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      const updatedUser = await User.updateById(req.user.id, updateData);
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      
      logger.info('User profile updated', { userId: req.user.id });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: userWithoutPassword }
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const { current_password, new_password } = req.body;
      const userId = req.user.id;

      // Get current user with password
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Validate current password
      const isValidPassword = await User.validatePassword(current_password, user.password);
      if (!isValidPassword) {
        logger.warn('Change password attempt with invalid current password', { userId });
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      await User.updatePassword(userId, new_password);
      
      logger.info('Password changed successfully', { userId });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Logout (client-side token removal, but we can log it)
  async logout(req, res) {
    try {
      logger.info('User logged out', { userId: req.user.id });
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Verify token (for client-side token validation)
  async verifyToken(req, res) {
    try {
      // If we reach here, the token is valid (middleware already verified it)
      const user = await User.getProfile(req.user.id);
      
      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      logger.error('Token verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new AuthController();