const DashboardMetric = require('../models/DashboardMetric');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const logger = require('../config/logger');
const moment = require('moment');

class DashboardController {
  // Get dashboard overview
  async getOverview(req, res) {
    try {
      const { period = '30' } = req.query;
      const days = parseInt(period);
      const startDate = moment().subtract(days, 'days').format('YYYY-MM-DD');
      const endDate = moment().format('YYYY-MM-DD');

      // Get parallel data
      const [
        revenueAnalytics,
        userStats,
        transactionSummary,
        latestMetrics
      ] = await Promise.all([
        Transaction.getRevenueAnalytics(startDate, endDate),
        this.getUserStats(),
        Transaction.getTransactionSummary(startDate, endDate, 'day'),
        DashboardMetric.getLatestMetrics(10)
      ]);

      const overview = {
        period: `${days} days`,
        date_range: { start: startDate, end: endDate },
        revenue: revenueAnalytics,
        users: userStats,
        transactions: {
          summary: transactionSummary,
          total_count: revenueAnalytics.total_transactions
        },
        latest_metrics: latestMetrics
      };

      logger.info('Dashboard overview retrieved', { userId: req.user?.id, period: days });

      res.json({
        success: true,
        data: overview
      });
    } catch (error) {
      logger.error('Dashboard overview error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get revenue analytics
  async getRevenueAnalytics(req, res) {
    try {
      const { start_date, end_date, group_by = 'day' } = req.query;
      
      const startDate = start_date || moment().subtract(30, 'days').format('YYYY-MM-DD');
      const endDate = end_date || moment().format('YYYY-MM-DD');

      const [analytics, trends] = await Promise.all([
        Transaction.getRevenueAnalytics(startDate, endDate),
        Transaction.getTransactionSummary(startDate, endDate, group_by)
      ]);

      res.json({
        success: true,
        data: {
          analytics,
          trends,
          period: { start: startDate, end: endDate, group_by }
        }
      });
    } catch (error) {
      logger.error('Revenue analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      const [totalUsers, activeUsers, adminUsers] = await Promise.all([
        User.count(),
        User.count({ is_active: true }),
        User.count({ role: 'admin' })
      ]);

      return {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        admins: adminUsers,
        regular_users: totalUsers - adminUsers
      };
    } catch (error) {
      logger.error('User stats error:', error);
      throw error;
    }
  }

  // Get transaction analytics
  async getTransactionAnalytics(req, res) {
    try {
      const { start_date, end_date, group_by = 'day' } = req.query;
      
      const startDate = start_date || moment().subtract(30, 'days').format('YYYY-MM-DD');
      const endDate = end_date || moment().format('YYYY-MM-DD');

      const [
        summary,
        statusBreakdown,
        typeBreakdown,
        topTransactions
      ] = await Promise.all([
        Transaction.getTransactionSummary(startDate, endDate, group_by),
        this.getTransactionStatusBreakdown(startDate, endDate),
        this.getTransactionTypeBreakdown(startDate, endDate),
        Transaction.getTopTransactions(10)
      ]);

      res.json({
        success: true,
        data: {
          summary,
          breakdown: {
            by_status: statusBreakdown,
            by_type: typeBreakdown
          },
          top_transactions: topTransactions,
          period: { start: startDate, end: endDate, group_by }
        }
      });
    } catch (error) {
      logger.error('Transaction analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get transaction status breakdown
  async getTransactionStatusBreakdown(startDate, endDate) {
    try {
      const breakdown = await Transaction.db('transactions')
        .select('status')
        .count('* as count')
        .sum('amount as total_amount')
        .whereBetween('transaction_date', [startDate, endDate])
        .groupBy('status');

      return breakdown;
    } catch (error) {
      logger.error('Transaction status breakdown error:', error);
      throw error;
    }
  }

  // Get transaction type breakdown
  async getTransactionTypeBreakdown(startDate, endDate) {
    try {
      const breakdown = await Transaction.db('transactions')
        .select('type')
        .count('* as count')
        .sum('amount as total_amount')
        .whereBetween('transaction_date', [startDate, endDate])
        .groupBy('type');

      return breakdown;
    } catch (error) {
      logger.error('Transaction type breakdown error:', error);
      throw error;
    }
  }

  // Get metrics dashboard
  async getMetrics(req, res) {
    try {
      const { category, period = '30' } = req.query;
      const days = parseInt(period);
      const startDate = moment().subtract(days, 'days').format('YYYY-MM-DD');
      const endDate = moment().format('YYYY-MM-DD');

      let metrics;
      if (category) {
        metrics = await DashboardMetric.getMetricsByCategory(category, {
          startDate,
          endDate,
          limit: 100
        });
      } else {
        metrics = await DashboardMetric.getMetricsByDateRange(startDate, endDate);
      }

      // Get unique categories and metric names for filtering
      const [categories, metricNames] = await Promise.all([
        DashboardMetric.getCategories(),
        DashboardMetric.getMetricNames()
      ]);

      res.json({
        success: true,
        data: {
          metrics,
          filters: {
            categories,
            metric_names: metricNames
          },
          period: { start: startDate, end: endDate, days }
        }
      });
    } catch (error) {
      logger.error('Metrics dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get metric trends
  async getMetricTrends(req, res) {
    try {
      const { metric_name, period = 'day', limit = 30 } = req.query;

      if (!metric_name) {
        return res.status(400).json({
          success: false,
          message: 'Metric name is required'
        });
      }

      const trends = await DashboardMetric.getMetricTrends(
        metric_name,
        period,
        parseInt(limit)
      );

      res.json({
        success: true,
        data: {
          metric_name,
          period,
          trends
        }
      });
    } catch (error) {
      logger.error('Metric trends error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get recent activity
  async getRecentActivity(req, res) {
    try {
      const { limit = 20 } = req.query;

      const [recentTransactions, recentMetrics] = await Promise.all([
        Transaction.findAll({}, {
          orderBy: 'created_at',
          order: 'desc',
          limit: parseInt(limit) / 2
        }),
        DashboardMetric.getLatestMetrics(parseInt(limit) / 2)
      ]);

      // Combine and sort by date
      const activities = [
        ...recentTransactions.map(t => ({
          type: 'transaction',
          id: t.id,
          title: t.description,
          amount: t.amount,
          status: t.status,
          date: t.created_at,
          metadata: { transaction_ref: t.transaction_ref, type: t.type }
        })),
        ...recentMetrics.map(m => ({
          type: 'metric',
          id: m.id,
          title: m.metric_name,
          value: m.value,
          unit: m.unit,
          date: m.created_at,
          metadata: { category: m.category, metric_type: m.metric_type }
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date))
       .slice(0, parseInt(limit));

      res.json({
        success: true,
        data: { activities }
      });
    } catch (error) {
      logger.error('Recent activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get dashboard widgets data
  async getWidgets(req, res) {
    try {
      const period = parseInt(req.query.period) || 30;
      const startDate = moment().subtract(period, 'days').format('YYYY-MM-DD');
      const endDate = moment().format('YYYY-MM-DD');

      const [
        totalRevenue,
        totalTransactions,
        activeUsers,
        pendingTransactions
      ] = await Promise.all([
        this.getTotalRevenue(startDate, endDate),
        this.getTotalTransactions(startDate, endDate),
        User.count({ is_active: true }),
        Transaction.count({ status: 'pending' })
      ]);

      const widgets = [
        {
          id: 'total_revenue',
          title: 'Total Revenue',
          value: totalRevenue.total || 0,
          format: 'currency',
          change: totalRevenue.change || 0,
          trend: totalRevenue.trend || 'neutral'
        },
        {
          id: 'total_transactions',
          title: 'Total Transactions',
          value: totalTransactions.total || 0,
          format: 'number',
          change: totalTransactions.change || 0,
          trend: totalTransactions.trend || 'neutral'
        },
        {
          id: 'active_users',
          title: 'Active Users',
          value: activeUsers,
          format: 'number',
          change: 0,
          trend: 'neutral'
        },
        {
          id: 'pending_transactions',
          title: 'Pending Transactions',
          value: pendingTransactions,
          format: 'number',
          change: 0,
          trend: 'neutral'
        }
      ];

      res.json({
        success: true,
        data: { widgets, period }
      });
    } catch (error) {
      logger.error('Dashboard widgets error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Helper method to get total revenue with change
  async getTotalRevenue(startDate, endDate) {
    try {
      const [current, previous] = await Promise.all([
        Transaction.getRevenueAnalytics(startDate, endDate),
        Transaction.getRevenueAnalytics(
          moment(startDate).subtract(30, 'days').format('YYYY-MM-DD'),
          moment(endDate).subtract(30, 'days').format('YYYY-MM-DD')
        )
      ]);

      const currentTotal = parseFloat(current.net_revenue) || 0;
      const previousTotal = parseFloat(previous.net_revenue) || 0;
      const change = previousTotal ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

      return {
        total: currentTotal,
        change: Math.round(change * 100) / 100,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
      };
    } catch (error) {
      logger.error('Total revenue calculation error:', error);
      return { total: 0, change: 0, trend: 'neutral' };
    }
  }

  // Helper method to get total transactions with change
  async getTotalTransactions(startDate, endDate) {
    try {
      const [current, previous] = await Promise.all([
        Transaction.count({
          transaction_date: `>= '${startDate}' AND transaction_date <= '${endDate}'`
        }),
        Transaction.count({
          transaction_date: `>= '${moment(startDate).subtract(30, 'days').format('YYYY-MM-DD')}' AND transaction_date <= '${moment(endDate).subtract(30, 'days').format('YYYY-MM-DD')}'`
        })
      ]);

      const change = previous ? ((current - previous) / previous) * 100 : 0;

      return {
        total: current,
        change: Math.round(change * 100) / 100,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
      };
    } catch (error) {
      logger.error('Total transactions calculation error:', error);
      return { total: 0, change: 0, trend: 'neutral' };
    }
  }
}

module.exports = new DashboardController();