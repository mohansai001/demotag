import api from './api';
import { 
  DashboardStats, 
  Widget, 
  CreateWidgetData, 
  UpdateWidgetData 
} from '../types/dashboard';

class DashboardService {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get<{ success: boolean; data: DashboardStats }>('/dashboard/stats');
    return response.data.data;
  }

  async getWidgets(): Promise<Widget[]> {
    const response = await api.get<{ success: boolean; data: Widget[] }>('/dashboard/widgets');
    return response.data.data;
  }

  async createWidget(data: CreateWidgetData): Promise<Widget> {
    const response = await api.post<{ success: boolean; data: Widget }>('/dashboard/widgets', data);
    return response.data.data;
  }

  async updateWidget(id: number, data: UpdateWidgetData): Promise<Widget> {
    const response = await api.put<{ success: boolean; data: Widget }>(`/dashboard/widgets/${id}`, data);
    return response.data.data;
  }

  async deleteWidget(id: number): Promise<void> {
    await api.delete(`/dashboard/widgets/${id}`);
  }

  async reorderWidgets(widgets: { id: number; position: number }[]): Promise<void> {
    await api.put('/dashboard/widgets/reorder', { widgets });
  }
}

export default new DashboardService();