const BaseModel = require('./BaseModel');
const logger = require('../config/logger');

class DashboardMetric extends BaseModel {
  constructor() {
    super('dashboard_metrics');
  }

  // Get metrics by date range
  async getMetricsByDateRange(startDate, endDate, filters = {}) {
    try {
      let query = this.db(this.tableName)
        .whereBetween('metric_date', [startDate, endDate]);

      // Apply additional filters
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          query = query.where(key, filters[key]);
        }
      });

      const results = await query.orderBy('metric_date', 'desc');
      logger.info(`Retrieved ${results.length} metrics for date range ${startDate} to ${endDate}`);
      return results;
    } catch (error) {
      logger.error('Error getting metrics by date range:', error);
      throw error;
    }
  }

  // Get latest metrics
  async getLatestMetrics(limit = 10) {
    try {
      const results = await this.db(this.tableName)
        .orderBy('created_at', 'desc')
        .limit(limit);
      
      logger.info(`Retrieved ${results.length} latest metrics`);
      return results;
    } catch (error) {
      logger.error('Error getting latest metrics:', error);
      throw error;
    }
  }

  // Get metrics by category
  async getMetricsByCategory(category, options = {}) {
    try {
      let query = this.db(this.tableName).where('category', category);
      
      if (options.startDate && options.endDate) {
        query = query.whereBetween('metric_date', [options.startDate, options.endDate]);
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const results = await query.orderBy('metric_date', 'desc');
      logger.info(`Retrieved ${results.length} metrics for category: ${category}`);
      return results;
    } catch (error) {
      logger.error('Error getting metrics by category:', error);
      throw error;
    }
  }

  // Get metric trends (aggregated by day/week/month)
  async getMetricTrends(metricName, period = 'day', limit = 30) {
    try {
      let dateFormat;
      switch (period) {
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
          this.db.raw(`TO_CHAR(metric_date, '${dateFormat}') as period`),
          this.db.raw('AVG(value) as avg_value'),
          this.db.raw('SUM(value) as total_value'),
          this.db.raw('COUNT(*) as count')
        )
        .where('metric_name', metricName)
        .groupBy(this.db.raw(`TO_CHAR(metric_date, '${dateFormat}')`))
        .orderBy('period', 'desc')
        .limit(limit);

      logger.info(`Retrieved ${results.length} trend data points for metric: ${metricName}`);
      return results;
    } catch (error) {
      logger.error('Error getting metric trends:', error);
      throw error;
    }
  }

  // Get metric summary statistics
  async getMetricSummary(metricName, startDate, endDate) {
    try {
      const [summary] = await this.db(this.tableName)
        .select(
          this.db.raw('COUNT(*) as count'),
          this.db.raw('AVG(value) as avg_value'),
          this.db.raw('MIN(value) as min_value'),
          this.db.raw('MAX(value) as max_value'),
          this.db.raw('SUM(value) as total_value')
        )
        .where('metric_name', metricName)
        .whereBetween('metric_date', [startDate, endDate]);

      logger.info(`Retrieved summary statistics for metric: ${metricName}`);
      return summary;
    } catch (error) {
      logger.error('Error getting metric summary:', error);
      throw error;
    }
  }

  // Create or update metric (upsert based on metric_name and date)
  async upsertMetric(metricData) {
    try {
      const existing = await this.findOne({
        metric_name: metricData.metric_name,
        metric_date: metricData.metric_date
      });

      if (existing) {
        const updated = await this.updateById(existing.id, metricData);
        logger.info(`Updated existing metric: ${metricData.metric_name} for date: ${metricData.metric_date}`);
        return updated;
      } else {
        const created = await this.create(metricData);
        logger.info(`Created new metric: ${metricData.metric_name} for date: ${metricData.metric_date}`);
        return created;
      }
    } catch (error) {
      logger.error('Error upserting metric:', error);
      throw error;
    }
  }

  // Get all unique metric names
  async getMetricNames() {
    try {
      const results = await this.db(this.tableName)
        .distinct('metric_name')
        .orderBy('metric_name');
      
      const metricNames = results.map(row => row.metric_name);
      logger.info(`Retrieved ${metricNames.length} unique metric names`);
      return metricNames;
    } catch (error) {
      logger.error('Error getting metric names:', error);
      throw error;
    }
  }

  // Get all unique categories
  async getCategories() {
    try {
      const results = await this.db(this.tableName)
        .distinct('category')
        .whereNotNull('category')
        .orderBy('category');
      
      const categories = results.map(row => row.category);
      logger.info(`Retrieved ${categories.length} unique categories`);
      return categories;
    } catch (error) {
      logger.error('Error getting categories:', error);
      throw error;
    }
  }

  // Delete old metrics (cleanup)
  async deleteOldMetrics(daysToKeep = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const deletedCount = await this.db(this.tableName)
        .where('metric_date', '<', cutoffDate)
        .del();
      
      logger.info(`Deleted ${deletedCount} old metrics older than ${daysToKeep} days`);
      return deletedCount;
    } catch (error) {
      logger.error('Error deleting old metrics:', error);
      throw error;
    }
  }
}

module.exports = new DashboardMetric();