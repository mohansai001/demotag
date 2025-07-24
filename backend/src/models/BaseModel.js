const db = require('../config/database');
const logger = require('../config/logger');

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = db;
  }

  // Get all records with optional filters
  async findAll(filters = {}, options = {}) {
    try {
      let query = this.db(this.tableName);
      
      // Apply filters
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          query = query.where(key, filters[key]);
        }
      });
      
      // Apply ordering
      if (options.orderBy) {
        query = query.orderBy(options.orderBy, options.order || 'asc');
      }
      
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.offset(options.offset);
      }
      
      const results = await query;
      logger.info(`Retrieved ${results.length} records from ${this.tableName}`);
      return results;
    } catch (error) {
      logger.error(`Error finding records in ${this.tableName}:`, error);
      throw error;
    }
  }

  // Find a single record by ID
  async findById(id) {
    try {
      const result = await this.db(this.tableName).where('id', id).first();
      if (result) {
        logger.info(`Found record with id ${id} in ${this.tableName}`);
      } else {
        logger.warn(`No record found with id ${id} in ${this.tableName}`);
      }
      return result;
    } catch (error) {
      logger.error(`Error finding record by id in ${this.tableName}:`, error);
      throw error;
    }
  }

  // Find a single record by filters
  async findOne(filters) {
    try {
      let query = this.db(this.tableName);
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          query = query.where(key, filters[key]);
        }
      });
      
      const result = await query.first();
      if (result) {
        logger.info(`Found record in ${this.tableName} with filters:`, filters);
      }
      return result;
    } catch (error) {
      logger.error(`Error finding record in ${this.tableName}:`, error);
      throw error;
    }
  }

  // Create a new record
  async create(data) {
    try {
      const [result] = await this.db(this.tableName).insert(data).returning('*');
      logger.info(`Created new record in ${this.tableName} with id:`, result.id);
      return result;
    } catch (error) {
      logger.error(`Error creating record in ${this.tableName}:`, error);
      throw error;
    }
  }

  // Update a record by ID
  async updateById(id, data) {
    try {
      const [result] = await this.db(this.tableName)
        .where('id', id)
        .update({ ...data, updated_at: new Date() })
        .returning('*');
      
      if (result) {
        logger.info(`Updated record with id ${id} in ${this.tableName}`);
      } else {
        logger.warn(`No record found to update with id ${id} in ${this.tableName}`);
      }
      return result;
    } catch (error) {
      logger.error(`Error updating record in ${this.tableName}:`, error);
      throw error;
    }
  }

  // Delete a record by ID
  async deleteById(id) {
    try {
      const result = await this.db(this.tableName).where('id', id).del();
      if (result) {
        logger.info(`Deleted record with id ${id} from ${this.tableName}`);
      } else {
        logger.warn(`No record found to delete with id ${id} in ${this.tableName}`);
      }
      return result > 0;
    } catch (error) {
      logger.error(`Error deleting record from ${this.tableName}:`, error);
      throw error;
    }
  }

  // Count records with optional filters
  async count(filters = {}) {
    try {
      let query = this.db(this.tableName);
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          query = query.where(key, filters[key]);
        }
      });
      
      const [{ count }] = await query.count('* as count');
      return parseInt(count);
    } catch (error) {
      logger.error(`Error counting records in ${this.tableName}:`, error);
      throw error;
    }
  }

  // Check if record exists
  async exists(filters) {
    try {
      const count = await this.count(filters);
      return count > 0;
    } catch (error) {
      logger.error(`Error checking existence in ${this.tableName}:`, error);
      throw error;
    }
  }
}

module.exports = BaseModel;