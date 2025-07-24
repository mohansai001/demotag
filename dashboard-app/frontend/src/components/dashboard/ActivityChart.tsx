import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { ActivityTrend } from '../../types/dashboard';
import dayjs from 'dayjs';

interface ActivityChartProps {
  data: ActivityTrend[];
  title?: string;
  height?: number;
}

const ActivityChart: React.FC<ActivityChartProps> = ({
  data,
  title = 'Activity Trend',
  height = 300,
}) => {
  const formattedData = data.map((item) => ({
    ...item,
    date: dayjs(item.date).format('MMM DD'),
  }));

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ width: '100%', height }}>
          <ResponsiveContainer>
            <AreaChart
              data={formattedData}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#1976d2"
                fillOpacity={1}
                fill="url(#colorActivity)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ActivityChart;