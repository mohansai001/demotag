const BaseModel = require('./BaseModel');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

class Transaction extends BaseModel {
  constructor() {
    super('transactions');
  }

  // Create transaction with auto-generated reference
  async create(transactionData) {
    try {
      const dataWithRef = {
        ...transactionData,
        transaction_ref: transactionData.transaction_ref || this.generateTransactionRef()
      };
      
      const transaction = await super.create(dataWithRef);
      logger.info(`Created transaction with ref: ${transaction.transaction_ref}`);
      return transaction;
    } catch (error) {
      logger.error('Error creating transaction:', error);
      throw error;
    }
  }

  // Generate unique transaction reference
  generateTransactionRef() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `TXN-${timestamp}-${random}`.toUpperCase();
  }

  // Get transactions by date range
  async getTransactionsByDateRange(startDate, endDate, filters = {}) {
    try {
      let query = this.db(this.tableName)
        .whereBetween('transaction_date', [startDate, endDate]);

      // Apply additional filters
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          if (key === 'amount_min') {
            query = query.where('amount', '>=', filters[key]);
          } else if (key === 'amount_max') {
            query = query.where('amount', '<=', filters[key]);
          } else {
            query = query.where(key, filters[key]);
          }
        }
      });

      const results = await query
        .leftJoin('users', 'transactions.user_id', 'users.id')
        .select(
          'transactions.*',
          'users.first_name',
          'users.last_name',
          'users.email'
        )
        .orderBy('transaction_date', 'desc');
      
      logger.info(`Retrieved ${results.length} transactions for date range ${startDate} to ${endDate}`);
      return results;
    } catch (error) {
      logger.error('Error getting transactions by date range:', error);
      throw error;
    }
  }

  // Get transactions by user
  async getTransactionsByUser(userId, options = {}) {
    try {
      let query = this.db(this.tableName).where('user_id', userId);
      
      if (options.status) {
        query = query.where('status', options.status);
      }
      
      if (options.type) {
        query = query.where('type', options.type);
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.offset(options.offset);
      }
      
      const results = await query.orderBy('transaction_date', 'desc');
      logger.info(`Retrieved ${results.length} transactions for user: ${userId}`);
      return results;
    } catch (error) {
      logger.error('Error getting transactions by user:', error);
      throw error;
    }
  }

  // Get transaction summary by period
  async getTransactionSummary(startDate, endDate, groupBy = 'day') {
    try {
      let dateFormat;
      switch (groupBy) {
        case 'week':
          dateFormat = 'YYYY-WW';
          break;
        case 'month':
          dateFormat = 'YYYY-MM';
          break;
        default:
          dateFormat = 'YYYY-MM-DD';
      }

      const results = await this.db(this.tableName)
        .select(
          this.db.raw(`TO_CHAR(transaction_date, '${dateFormat}') as period`),
          'type',
          'status',
          this.db.raw('COUNT(*) as count'),
          this.db.raw('SUM(amount) as total_amount'),
          this.db.raw('AVG(amount) as avg_amount')
        )
        .whereBetween('transaction_date', [startDate, endDate])
        .groupBy(this.db.raw(`TO_CHAR(transaction_date, '${dateFormat}')`), 'type', 'status')
        .orderBy('period', 'desc');

      logger.info(`Retrieved transaction summary for period: ${startDate} to ${endDate}`);
      return results;
    } catch (error) {
      logger.error('Error getting transaction summary:', error);
      throw error;
    }
  }

  // Get revenue analytics
  async getRevenueAnalytics(startDate, endDate) {
    try {
      const [analytics] = await this.db(this.tableName)
        .select(
          this.db.raw('COUNT(*) as total_transactions'),
          this.db.raw('SUM(CASE WHEN type = \'income\' THEN amount ELSE 0 END) as total_income'),
          this.db.raw('SUM(CASE WHEN type = \'expense\' THEN amount ELSE 0 END) as total_expenses'),
          this.db.raw('SUM(CASE WHEN type = \'income\' THEN amount ELSE -amount END) as net_revenue'),
          this.db.raw('AVG(amount) as avg_transaction_amount'),
          this.db.raw('COUNT(DISTINCT user_id) as unique_users')
        )
        .whereBetween('transaction_date', [startDate, endDate])
        .where('status', 'completed');

      logger.info(`Retrieved revenue analytics for period: ${startDate} to ${endDate}`);
      return analytics;
    } catch (error) {
      logger.error('Error getting revenue analytics:', error);
      throw error;
    }
  }

  // Get transactions by status
  async getTransactionsByStatus(status, options = {}) {
    try {
      let query = this.db(this.tableName).where('status', status);
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.offset(options.offset);
      }
      
      const results = await query
        .leftJoin('users', 'transactions.user_id', 'users.id')
        .select(
          'transactions.*',
          'users.first_name',
          'users.last_name',
          'users.email'
        )
        .orderBy('transaction_date', 'desc');
      
      logger.info(`Retrieved ${results.length} transactions with status: ${status}`);
      return results;
    } catch (error) {
      logger.error('Error getting transactions by status:', error);
      throw error;
    }
  }

  // Update transaction status
  async updateStatus(transactionId, status, metadata = {}) {
    try {
      const updateData = {
        status,
        metadata: { ...metadata, status_updated_at: new Date() }
      };
      
      const result = await this.updateById(transactionId, updateData);
      logger.info(`Updated transaction ${transactionId} status to: ${status}`);
      return result;
    } catch (error) {
      logger.error('Error updating transaction status:', error);
      throw error;
    }
  }

  // Find transaction by reference
  async findByReference(transactionRef) {
    try {
      const result = await this.findOne({ transaction_ref: transactionRef });
      if (result) {
        logger.info(`Found transaction with reference: ${transactionRef}`);
      }
      return result;
    } catch (error) {
      logger.error('Error finding transaction by reference:', error);
      throw error;
    }
  }

  // Get top transactions by amount
  async getTopTransactions(limit = 10, type = null) {
    try {
      let query = this.db(this.tableName);
      
      if (type) {
        query = query.where('type', type);
      }
      
      const results = await query
        .leftJoin('users', 'transactions.user_id', 'users.id')
        .select(
          'transactions.*',
          'users.first_name',
          'users.last_name',
          'users.email'
        )
        .orderBy('amount', 'desc')
        .limit(limit);
      
      logger.info(`Retrieved top ${limit} transactions${type ? ` of type: ${type}` : ''}`);
      return results;
    } catch (error) {
      logger.error('Error getting top transactions:', error);
      throw error;
    }
  }

  // Get transactions by category
  async getTransactionsByCategory(category, options = {}) {
    try {
      let query = this.db(this.tableName).where('category', category);
      
      if (options.startDate && options.endDate) {
        query = query.whereBetween('transaction_date', [options.startDate, options.endDate]);
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const results = await query.orderBy('transaction_date', 'desc');
      logger.info(`Retrieved ${results.length} transactions for category: ${category}`);
      return results;
    } catch (error) {
      logger.error('Error getting transactions by category:', error);
      throw error;
    }
  }

  // Search transactions
  async searchTransactions(searchTerm, options = {}) {
    try {
      let query = this.db(this.tableName)
        .leftJoin('users', 'transactions.user_id', 'users.id')
        .where('transaction_ref', 'ILIKE', `%${searchTerm}%`)
        .orWhere('description', 'ILIKE', `%${searchTerm}%`)
        .orWhere('users.first_name', 'ILIKE', `%${searchTerm}%`)
        .orWhere('users.last_name', 'ILIKE', `%${searchTerm}%`)
        .orWhere('users.email', 'ILIKE', `%${searchTerm}%`);

      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.offset(options.offset);
      }

      const results = await query
        .select(
          'transactions.*',
          'users.first_name',
          'users.last_name',
          'users.email'
        )
        .orderBy('transaction_date', 'desc');
      
      logger.info(`Found ${results.length} transactions matching search: ${searchTerm}`);
      return results;
    } catch (error) {
      logger.error('Error searching transactions:', error);
      throw error;
    }
  }
}

module.exports = new Transaction();