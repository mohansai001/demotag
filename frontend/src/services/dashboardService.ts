import { apiService, ApiResponse } from './api'

// Dashboard service for analytics and metrics
class DashboardService {
  // Get dashboard overview
  async getOverview(period?: string): Promise<ApiResponse<any>> {
    return apiService.get('/dashboard/overview', { params: { period } })
  }

  // Get dashboard widgets
  async getWidgets(period?: string): Promise<ApiResponse<any>> {
    return apiService.get('/dashboard/widgets', { params: { period } })
  }

  // Get revenue analytics
  async getRevenueAnalytics(startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    return apiService.get('/dashboard/revenue', { 
      params: { start_date: startDate, end_date: endDate } 
    })
  }

  // Get recent activity
  async getRecentActivity(limit?: number): Promise<ApiResponse<any>> {
    return apiService.get('/dashboard/activity', { params: { limit } })
  }
}

export const dashboardService = new DashboardService()