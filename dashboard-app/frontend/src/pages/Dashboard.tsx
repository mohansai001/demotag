import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Activity as ActivityIcon,
  Notifications as NotificationsIcon,
  Widgets as WidgetsIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import StatsCard from '../components/dashboard/StatsCard';
import ActivityChart from '../components/dashboard/ActivityChart';
import dashboardService from '../services/dashboardService';
import { useAuth } from '../contexts/AuthContext';

dayjs.extend(relativeTime);

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: dashboardService.getStats,
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load dashboard data. Please try refreshing the page.
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Activities"
            value={stats.userStats.totalActivities}
            icon={<ActivityIcon />}
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Unread Notifications"
            value={stats.userStats.unreadNotifications}
            icon={<NotificationsIcon />}
            color="warning"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Widgets"
            value={stats.userStats.activeWidgets}
            icon={<WidgetsIcon />}
            color="success"
          />
        </Grid>

        {user?.role === 'admin' && stats.systemStats && (
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Total Users"
              value={stats.systemStats.totalUsers}
              icon={<PeopleIcon />}
              color="info"
            />
          </Grid>
        )}

        {/* Activity Chart */}
        <Grid item xs={12} md={8}>
          <ActivityChart data={stats.activityTrend} />
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activities
              </Typography>
              <List>
                {stats.recentActivities.map((activity) => (
                  <ListItem key={activity.id} divider>
                    <ListItemText
                      primary={activity.action.replace(/_/g, ' ')}
                      secondary={
                        <>
                          {activity.description}
                          <br />
                          <Typography variant="caption" color="textSecondary">
                            {dayjs(activity.created_at).fromNow()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
                {stats.recentActivities.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No recent activities"
                      secondary="Your activities will appear here"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Admin Stats */}
        {user?.role === 'admin' && stats.systemStats && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                System Overview
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h3" color="primary">
                      {stats.systemStats.activeUsers}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Active Users
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h3" color="secondary">
                      {stats.systemStats.todayActivities}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Today's Activities
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h3" color="success.main">
                      {((stats.systemStats.activeUsers / stats.systemStats.totalUsers) * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      User Engagement
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;