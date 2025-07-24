const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { pool } = require('../config/database');
const logger = require('../config/logger');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { username, email, password, firstName, lastName } = req.body;

    // Check if user exists
    const userExists = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email or username',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (username, email, password, first_name, last_name) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, username, email, first_name, last_name, role, created_at`,
      [username, email, hashedPassword, firstName || null, lastName || null]
    );

    const user = result.rows[0];

    // Log activity
    await pool.query(
      'INSERT INTO activities (user_id, action, description) VALUES ($1, $2, $3)',
      [user.id, 'USER_REGISTERED', 'New user registration']
    );

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        },
        token: generateToken(user.id),
      },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Check user exists
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated',
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Log activity
    await pool.query(
      'INSERT INTO activities (user_id, action, description) VALUES ($1, $2, $3)',
      [user.id, 'USER_LOGIN', 'User logged in']
    );

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        },
        token: generateToken(user.id),
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, first_name, last_name, role, created_at, updated_at 
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    });
  } catch (error) {
    logger.error('Get user error:', error);
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { firstName, lastName, email } = req.body;
    const userId = req.user.id;

    // Check if email is already taken by another user
    if (email && email !== req.user.email) {
      const emailExists = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );

      if (emailExists.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Email already in use',
        });
      }
    }

    // Update user
    const result = await pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name), 
           last_name = COALESCE($2, last_name),
           email = COALESCE($3, email)
       WHERE id = $4
       RETURNING id, username, email, first_name, last_name, role, updated_at`,
      [firstName, lastName, email, userId]
    );

    const user = result.rows[0];

    // Log activity
    await pool.query(
      'INSERT INTO activities (user_id, action, description) VALUES ($1, $2, $3)',
      [userId, 'PROFILE_UPDATED', 'User updated profile']
    );

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        updatedAt: user.updated_at,
      },
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get user with password
    const result = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );

    const user = result.rows[0];

    // Check current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    // Log activity
    await pool.query(
      'INSERT INTO activities (user_id, action, description) VALUES ($1, $2, $3)',
      [userId, 'PASSWORD_CHANGED', 'User changed password']
    );

    logger.info(`Password changed for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error('Change password error:', error);
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
};