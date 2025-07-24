const { pool } = require('../config/database');
const logger = require('../config/logger');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const client = await pool.connect();

    try {
      // Get user statistics
      const userStats = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM activities WHERE user_id = $1) as total_activities,
          (SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false) as unread_notifications,
          (SELECT COUNT(*) FROM dashboard_widgets WHERE user_id = $1 AND is_visible = true) as active_widgets
      `, [userId]);

      // Get recent activities
      const recentActivities = await client.query(`
        SELECT id, action, description, created_at
        FROM activities
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 5
      `, [userId]);

      // Get activity trend (last 7 days)
      const activityTrend = await client.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM activities
        WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `, [userId]);

      // Get system-wide stats (for admin users)
      let systemStats = null;
      if (req.user.role === 'admin') {
        const totalUsers = await client.query('SELECT COUNT(*) FROM users');
        const activeUsers = await client.query(
          "SELECT COUNT(*) FROM users WHERE is_active = true"
        );
        const todayActivities = await client.query(
          "SELECT COUNT(*) FROM activities WHERE DATE(created_at) = CURRENT_DATE"
        );

        systemStats = {
          totalUsers: parseInt(totalUsers.rows[0].count),
          activeUsers: parseInt(activeUsers.rows[0].count),
          todayActivities: parseInt(todayActivities.rows[0].count),
        };
      }

      res.json({
        success: true,
        data: {
          userStats: {
            totalActivities: parseInt(userStats.rows[0].total_activities),
            unreadNotifications: parseInt(userStats.rows[0].unread_notifications),
            activeWidgets: parseInt(userStats.rows[0].active_widgets),
          },
          recentActivities: recentActivities.rows,
          activityTrend: activityTrend.rows.map(row => ({
            date: row.date,
            count: parseInt(row.count),
          })),
          systemStats,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    next(error);
  }
};

// @desc    Get user's dashboard widgets
// @route   GET /api/dashboard/widgets
// @access  Private
const getWidgets = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, widget_type, position, settings, is_visible, created_at, updated_at
       FROM dashboard_widgets
       WHERE user_id = $1
       ORDER BY position ASC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error('Get widgets error:', error);
    next(error);
  }
};

// @desc    Create new widget
// @route   POST /api/dashboard/widgets
// @access  Private
const createWidget = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { widgetType, position, settings } = req.body;

    // Validate widget type
    const allowedWidgetTypes = [
      'stats',
      'chart',
      'table',
      'calendar',
      'todo',
      'weather',
      'news',
      'custom',
    ];

    if (!allowedWidgetTypes.includes(widgetType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid widget type',
      });
    }

    const result = await pool.query(
      `INSERT INTO dashboard_widgets (user_id, widget_type, position, settings)
       VALUES ($1, $2, $3, $4)
       RETURNING id, widget_type, position, settings, is_visible, created_at`,
      [userId, widgetType, position || 0, settings || {}]
    );

    // Log activity
    await pool.query(
      'INSERT INTO activities (user_id, action, description, metadata) VALUES ($1, $2, $3, $4)',
      [userId, 'WIDGET_CREATED', `Created ${widgetType} widget`, { widgetId: result.rows[0].id }]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Create widget error:', error);
    next(error);
  }
};

// @desc    Update widget
// @route   PUT /api/dashboard/widgets/:id
// @access  Private
const updateWidget = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const widgetId = req.params.id;
    const { position, settings, isVisible } = req.body;

    // Check if widget belongs to user
    const widgetCheck = await pool.query(
      'SELECT id FROM dashboard_widgets WHERE id = $1 AND user_id = $2',
      [widgetId, userId]
    );

    if (widgetCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Widget not found',
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (position !== undefined) {
      updates.push(`position = $${paramCount}`);
      values.push(position);
      paramCount++;
    }

    if (settings !== undefined) {
      updates.push(`settings = $${paramCount}`);
      values.push(settings);
      paramCount++;
    }

    if (isVisible !== undefined) {
      updates.push(`is_visible = $${paramCount}`);
      values.push(isVisible);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }

    values.push(widgetId);
    values.push(userId);

    const result = await pool.query(
      `UPDATE dashboard_widgets
       SET ${updates.join(', ')}
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
       RETURNING id, widget_type, position, settings, is_visible, updated_at`,
      values
    );

    // Log activity
    await pool.query(
      'INSERT INTO activities (user_id, action, description, metadata) VALUES ($1, $2, $3, $4)',
      [userId, 'WIDGET_UPDATED', 'Updated widget settings', { widgetId }]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Update widget error:', error);
    next(error);
  }
};

// @desc    Delete widget
// @route   DELETE /api/dashboard/widgets/:id
// @access  Private
const deleteWidget = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const widgetId = req.params.id;

    const result = await pool.query(
      'DELETE FROM dashboard_widgets WHERE id = $1 AND user_id = $2 RETURNING widget_type',
      [widgetId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Widget not found',
      });
    }

    // Log activity
    await pool.query(
      'INSERT INTO activities (user_id, action, description, metadata) VALUES ($1, $2, $3, $4)',
      [userId, 'WIDGET_DELETED', `Deleted ${result.rows[0].widget_type} widget`, { widgetId }]
    );

    res.json({
      success: true,
      message: 'Widget deleted successfully',
    });
  } catch (error) {
    logger.error('Delete widget error:', error);
    next(error);
  }
};

// @desc    Reorder widgets
// @route   PUT /api/dashboard/widgets/reorder
// @access  Private
const reorderWidgets = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { widgets } = req.body;

    if (!Array.isArray(widgets)) {
      return res.status(400).json({
        success: false,
        error: 'Widgets must be an array',
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Update positions for all widgets
      for (const widget of widgets) {
        await client.query(
          'UPDATE dashboard_widgets SET position = $1 WHERE id = $2 AND user_id = $3',
          [widget.position, widget.id, userId]
        );
      }

      await client.query('COMMIT');

      // Log activity
      await pool.query(
        'INSERT INTO activities (user_id, action, description) VALUES ($1, $2, $3)',
        [userId, 'WIDGETS_REORDERED', 'Reordered dashboard widgets']
      );

      res.json({
        success: true,
        message: 'Widgets reordered successfully',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Reorder widgets error:', error);
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getWidgets,
  createWidget,
  updateWidget,
  deleteWidget,
  reorderWidgets,
};