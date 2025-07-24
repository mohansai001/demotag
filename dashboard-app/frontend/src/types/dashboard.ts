export interface DashboardStats {
  userStats: {
    totalActivities: number;
    unreadNotifications: number;
    activeWidgets: number;
  };
  recentActivities: Activity[];
  activityTrend: ActivityTrend[];
  systemStats?: SystemStats;
}

export interface Activity {
  id: number;
  action: string;
  description: string;
  created_at: string;
}

export interface ActivityTrend {
  date: string;
  count: number;
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  todayActivities: number;
}

export interface Widget {
  id: number;
  widget_type: WidgetType;
  position: number;
  settings: Record<string, any>;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export type WidgetType = 
  | 'stats'
  | 'chart'
  | 'table'
  | 'calendar'
  | 'todo'
  | 'weather'
  | 'news'
  | 'custom';

export interface CreateWidgetData {
  widgetType: WidgetType;
  position?: number;
  settings?: Record<string, any>;
}

export interface UpdateWidgetData {
  position?: number;
  settings?: Record<string, any>;
  isVisible?: boolean;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
  read_at?: string;
}