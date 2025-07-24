const BaseModel = require('./BaseModel');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');

class User extends BaseModel {
  constructor() {
    super('users');
  }

  // Create user with hashed password
  async create(userData) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const userToCreate = {
        ...userData,
        password: hashedPassword
      };
      
      const user = await super.create(userToCreate);
      
      // Remove password from returned user object
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  // Find user by email
  async findByEmail(email) {
    try {
      return await this.findOne({ email: email.toLowerCase() });
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Validate user password
  async validatePassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      logger.error('Error validating password:', error);
      throw error;
    }
  }

  // Update user password
  async updatePassword(userId, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      return await this.updateById(userId, { password: hashedPassword });
    } catch (error) {
      logger.error('Error updating user password:', error);
      throw error;
    }
  }

  // Get user profile (without password)
  async getProfile(userId) {
    try {
      const user = await this.findById(userId);
      if (!user) return null;
      
      const { password, ...profile } = user;
      return profile;
    } catch (error) {
      logger.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Update last login
  async updateLastLogin(userId) {
    try {
      return await this.updateById(userId, { last_login: new Date() });
    } catch (error) {
      logger.error('Error updating last login:', error);
      throw error;
    }
  }

  // Get active users
  async getActiveUsers() {
    try {
      return await this.findAll({ is_active: true });
    } catch (error) {
      logger.error('Error getting active users:', error);
      throw error;
    }
  }

  // Deactivate user
  async deactivateUser(userId) {
    try {
      return await this.updateById(userId, { is_active: false });
    } catch (error) {
      logger.error('Error deactivating user:', error);
      throw error;
    }
  }

  // Activate user
  async activateUser(userId) {
    try {
      return await this.updateById(userId, { is_active: true });
    } catch (error) {
      logger.error('Error activating user:', error);
      throw error;
    }
  }

  // Get users by role
  async getUsersByRole(role) {
    try {
      return await this.findAll({ role });
    } catch (error) {
      logger.error('Error getting users by role:', error);
      throw error;
    }
  }

  // Search users
  async searchUsers(searchTerm, options = {}) {
    try {
      const query = this.db(this.tableName)
        .where('first_name', 'ILIKE', `%${searchTerm}%`)
        .orWhere('last_name', 'ILIKE', `%${searchTerm}%`)
        .orWhere('email', 'ILIKE', `%${searchTerm}%`);

      if (options.limit) {
        query.limit(options.limit);
      }
      if (options.offset) {
        query.offset(options.offset);
      }

      const users = await query.select('id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'created_at');
      return users;
    } catch (error) {
      logger.error('Error searching users:', error);
      throw error;
    }
  }
}

module.exports = new User();