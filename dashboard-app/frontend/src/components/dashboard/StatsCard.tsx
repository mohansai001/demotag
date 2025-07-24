import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'primary',
}) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ mb: 1 }}>
              {value}
            </Typography>
            {trend && (
              <Chip
                size="small"
                icon={trend.isPositive ? <TrendingUp /> : <TrendingDown />}
                label={`${trend.isPositive ? '+' : ''}${trend.value}%`}
                color={trend.isPositive ? 'success' : 'error'}
                sx={{ height: 24 }}
              />
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: `${color}.light`,
                color: `${color}.main`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatsCard;