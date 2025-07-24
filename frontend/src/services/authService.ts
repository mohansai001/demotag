import { apiService, ApiResponse } from './api'
import { User, LoginCredentials, RegisterData } from '@contexts/AuthContext'

export interface AuthResponse {
  user: User
  token: string
}

class AuthService {
  // Login user
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    return apiService.post<AuthResponse>('/auth/login', credentials)
  }

  // Register user
  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    return apiService.post<AuthResponse>('/auth/register', data)
  }

  // Get user profile
  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return apiService.get<{ user: User }>('/auth/profile')
  }

  // Update user profile
  async updateProfile(data: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    return apiService.put<{ user: User }>('/auth/profile', data)
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    return apiService.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    })
  }

  // Verify token
  async verifyToken(): Promise<ApiResponse<{ user: User }>> {
    return apiService.get<{ user: User }>('/auth/verify')
  }

  // Logout
  async logout(): Promise<ApiResponse> {
    return apiService.post('/auth/logout')
  }
}

export const authService = new AuthService()