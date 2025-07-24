const Joi = require('joi');
const logger = require('../config/logger');

// Generic validation middleware
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Validation error:', { 
        errors: errorMessages, 
        ip: req.ip, 
        url: req.url 
      });

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorMessages
      });
    }

    // Replace the original data with validated and sanitized data
    req[property] = value;
    next();
  };
};

// User validation schemas
const userSchemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
    first_name: Joi.string().min(2).max(50).required().messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name must not exceed 50 characters',
      'any.required': 'First name is required'
    }),
    last_name: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name must not exceed 50 characters',
      'any.required': 'Last name is required'
    }),
    role: Joi.string().valid('user', 'admin', 'manager').default('user')
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  }),

  updateProfile: Joi.object({
    first_name: Joi.string().min(2).max(50),
    last_name: Joi.string().min(2).max(50),
    avatar_url: Joi.string().uri().allow('', null)
  }),

  changePassword: Joi.object({
    current_password: Joi.string().required(),
    new_password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required().messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base': 'New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    })
  })
};

// Transaction validation schemas
const transactionSchemas = {
  create: Joi.object({
    description: Joi.string().min(3).max(255).required(),
    amount: Joi.number().positive().precision(2).required(),
    currency: Joi.string().length(3).uppercase().default('USD'),
    type: Joi.string().valid('income', 'expense', 'transfer').required(),
    category: Joi.string().max(100),
    payment_method: Joi.string().max(100),
    user_id: Joi.string().uuid(),
    transaction_date: Joi.date().default(Date.now),
    metadata: Joi.object()
  }),

  update: Joi.object({
    description: Joi.string().min(3).max(255),
    amount: Joi.number().positive().precision(2),
    currency: Joi.string().length(3).uppercase(),
    type: Joi.string().valid('income', 'expense', 'transfer'),
    category: Joi.string().max(100),
    payment_method: Joi.string().max(100),
    status: Joi.string().valid('pending', 'completed', 'failed', 'cancelled'),
    metadata: Joi.object()
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('pending', 'completed', 'failed', 'cancelled').required(),
    metadata: Joi.object()
  })
};

// Dashboard metric validation schemas
const metricSchemas = {
  create: Joi.object({
    metric_name: Joi.string().min(2).max(100).required(),
    metric_type: Joi.string().valid('counter', 'gauge', 'percentage').required(),
    value: Joi.number().required(),
    unit: Joi.string().max(20),
    category: Joi.string().max(50),
    description: Joi.string().max(500),
    metadata: Joi.object(),
    metric_date: Joi.date().default(Date.now)
  }),

  update: Joi.object({
    metric_name: Joi.string().min(2).max(100),
    metric_type: Joi.string().valid('counter', 'gauge', 'percentage'),
    value: Joi.number(),
    unit: Joi.string().max(20),
    category: Joi.string().max(50),
    description: Joi.string().max(500),
    metadata: Joi.object(),
    metric_date: Joi.date()
  })
};

// Query parameter validation schemas
const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().max(50),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),

  dateRange: Joi.object({
    start_date: Joi.date().required(),
    end_date: Joi.date().min(Joi.ref('start_date')).required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  }),

  search: Joi.object({
    q: Joi.string().min(1).max(100).required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10)
  })
};

// UUID parameter validation
const uuidSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid ID format',
    'any.required': 'ID is required'
  })
});

// Validation middleware functions
const validateUser = {
  register: validate(userSchemas.register),
  login: validate(userSchemas.login),
  updateProfile: validate(userSchemas.updateProfile),
  changePassword: validate(userSchemas.changePassword)
};

const validateTransaction = {
  create: validate(transactionSchemas.create),
  update: validate(transactionSchemas.update),
  updateStatus: validate(transactionSchemas.updateStatus)
};

const validateMetric = {
  create: validate(metricSchemas.create),
  update: validate(metricSchemas.update)
};

const validateQuery = {
  pagination: validate(querySchemas.pagination, 'query'),
  dateRange: validate(querySchemas.dateRange, 'query'),
  search: validate(querySchemas.search, 'query')
};

const validateParams = {
  uuid: validate(uuidSchema, 'params')
};

// Custom validation helpers
const validateEmail = (email) => {
  const schema = Joi.string().email();
  const { error } = schema.validate(email);
  return !error;
};

const validatePassword = (password) => {
  const schema = Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'));
  const { error } = schema.validate(password);
  return !error;
};

const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim();
  }
  return input;
};

module.exports = {
  validate,
  validateUser,
  validateTransaction,
  validateMetric,
  validateQuery,
  validateParams,
  validateEmail,
  validatePassword,
  sanitizeInput
};