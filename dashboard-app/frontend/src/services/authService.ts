import api from './api';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../types/auth';

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    const { data } = response.data;
    
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return response.data;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    const { data } = response.data;
    
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get<{ success: boolean; data: User }>('/auth/me');
    return response.data.data;
  }

  async updateProfile(profileData: Partial<User>): Promise<User> {
    const response = await api.put<{ success: boolean; data: User }>('/auth/profile', profileData);
    const user = response.data.data;
    
    // Update stored user data
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put('/auth/password', { currentPassword, newPassword });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export default new AuthService();