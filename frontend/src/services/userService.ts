import { apiService, ApiResponse } from './api'

// User service placeholder
class UserService {
  // Get all users (admin only)
  async getUsers(params?: any): Promise<ApiResponse<any>> {
    return apiService.get('/users', { params })
  }

  // Get user by ID
  async getUserById(id: string): Promise<ApiResponse<any>> {
    return apiService.get(`/users/${id}`)
  }

  // Update user
  async updateUser(id: string, data: any): Promise<ApiResponse<any>> {
    return apiService.put(`/users/${id}`, data)
  }

  // Delete user
  async deleteUser(id: string): Promise<ApiResponse<any>> {
    return apiService.delete(`/users/${id}`)
  }
}

export const userService = new UserService()