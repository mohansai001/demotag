const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      logger.warn('Access denied: No token provided', { ip: req.ip, url: req.url });
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.getProfile(decoded.userId);
    if (!user) {
      logger.warn('Access denied: User not found', { userId: decoded.userId, ip: req.ip });
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not found.'
      });
    }

    if (!user.is_active) {
      logger.warn('Access denied: User account is inactive', { userId: user.id, ip: req.ip });
      return res.status(401).json({
        success: false,
        message: 'Access denied. Account is inactive.'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Access denied: Invalid token', { ip: req.ip, error: error.message });
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      logger.warn('Access denied: Token expired', { ip: req.ip });
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token expired.'
      });
    }

    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

// Middleware to check user roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn('Authorization failed: No user in request', { ip: req.ip });
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Authorization failed: Insufficient permissions', { 
        userId: req.user.id, 
        userRole: req.user.role, 
        requiredRoles: roles,
        ip: req.ip 
      });
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Middleware to check if user owns the resource
const authorizeOwnership = (userIdParam = 'userId') => {
  return (req, res, next) => {
    const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // User can only access their own resources
    if (req.user.id !== resourceUserId) {
      logger.warn('Authorization failed: User trying to access another user\'s resource', {
        userId: req.user.id,
        requestedUserId: resourceUserId,
        ip: req.ip
      });
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }

    next();
  };
};

// Optional authentication (for routes that work with or without auth)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.getProfile(decoded.userId);
      
      if (user && user.is_active) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Ignore errors for optional auth, just continue without user
    next();
  }
};

// Generate JWT token
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

// Refresh token middleware
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await User.getProfile(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token.'
      });
    }

    // Generate new access token
    const newAccessToken = generateToken(user);
    
    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        user: user
      }
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token.'
    });
  }
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizeOwnership,
  optionalAuth,
  generateToken,
  refreshToken
};