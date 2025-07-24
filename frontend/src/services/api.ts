import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import toast from 'react-hot-toast'

// Types
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: Array<{ field: string; message: string }>
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  data: {
    items: T[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response
      },
      (error) => {
        this.handleResponseError(error)
        return Promise.reject(error)
      }
    )
  }

  private handleResponseError(error: any) {
    if (!error.response) {
      // Network error
      toast.error('Network error. Please check your connection.')
      return
    }

    const { status, data } = error.response

    switch (status) {
      case 400:
        if (data.errors && Array.isArray(data.errors)) {
          // Validation errors
          data.errors.forEach((err: { message: string }) => {
            toast.error(err.message)
          })
        } else {
          toast.error(data.message || 'Bad request')
        }
        break

      case 401:
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('authToken')
        toast.error('Session expired. Please login again.')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        break

      case 403:
        toast.error('Access denied. Insufficient permissions.')
        break

      case 404:
        toast.error('Resource not found.')
        break

      case 429:
        toast.error('Too many requests. Please try again later.')
        break

      case 500:
        toast.error('Server error. Please try again later.')
        break

      default:
        toast.error(data.message || 'An unexpected error occurred')
    }
  }

  // Generic request method
  private async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.request<ApiResponse<T>>(config)
      return response.data
    } catch (error) {
      throw error
    }
  }

  // HTTP Methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url })
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data })
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data })
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data })
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url })
  }

  // Utility methods
  setAuthToken(token: string) {
    localStorage.setItem('authToken', token)
  }

  removeAuthToken() {
    localStorage.removeItem('authToken')
  }

  getAuthToken(): string | null {
    return localStorage.getItem('authToken')
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.get('/health')
  }
}

// Create and export instance
export const apiService = new ApiService()

// Export specific API modules
export * from './authService'
export * from './dashboardService'
export * from './transactionService'
export * from './userService'