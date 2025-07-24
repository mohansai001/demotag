import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'

import { apiService } from '@services/api'

// Types
export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  avatar_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  first_name: string
  last_name: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Auth Provider Component
interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const queryClient = useQueryClient()

  // Query to verify token and get user data
  const {
    data: userData,
    isLoading: loading,
    error,
  } = useQuery(
    'auth-user',
    async () => {
      const token = apiService.getAuthToken()
      if (!token) {
        throw new Error('No token found')
      }
      
      const response = await apiService.get<{ user: User }>('/auth/verify')
      return response.data?.user
    },
    {
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (data) {
          setUser(data)
        }
      },
      onError: () => {
        // Clear invalid token
        apiService.removeAuthToken()
        setUser(null)
      },
    }
  )

  // Login mutation
  const loginMutation = useMutation(
    async (credentials: LoginCredentials) => {
      const response = await apiService.post<{ user: User; token: string }>('/auth/login', credentials)
      return response.data
    },
    {
      onSuccess: (data) => {
        if (data?.token && data?.user) {
          apiService.setAuthToken(data.token)
          setUser(data.user)
          queryClient.setQueryData('auth-user', data.user)
          toast.success('Login successful!')
        }
      },
      onError: (error: any) => {
        console.error('Login error:', error)
      },
    }
  )

  // Register mutation
  const registerMutation = useMutation(
    async (data: RegisterData) => {
      const response = await apiService.post<{ user: User; token: string }>('/auth/register', data)
      return response.data
    },
    {
      onSuccess: (data) => {
        if (data?.token && data?.user) {
          apiService.setAuthToken(data.token)
          setUser(data.user)
          queryClient.setQueryData('auth-user', data.user)
          toast.success('Registration successful!')
        }
      },
      onError: (error: any) => {
        console.error('Registration error:', error)
      },
    }
  )

  // Update profile mutation
  const updateProfileMutation = useMutation(
    async (data: Partial<User>) => {
      const response = await apiService.put<{ user: User }>('/auth/profile', data)
      return response.data?.user
    },
    {
      onSuccess: (updatedUser) => {
        if (updatedUser) {
          setUser(updatedUser)
          queryClient.setQueryData('auth-user', updatedUser)
          toast.success('Profile updated successfully!')
        }
      },
      onError: (error: any) => {
        console.error('Profile update error:', error)
      },
    }
  )

  // Change password mutation
  const changePasswordMutation = useMutation(
    async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      await apiService.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
    },
    {
      onSuccess: () => {
        toast.success('Password changed successfully!')
      },
      onError: (error: any) => {
        console.error('Change password error:', error)
      },
    }
  )

  // Auth methods
  const login = async (credentials: LoginCredentials): Promise<void> => {
    await loginMutation.mutateAsync(credentials)
  }

  const register = async (data: RegisterData): Promise<void> => {
    await registerMutation.mutateAsync(data)
  }

  const logout = (): void => {
    apiService.removeAuthToken()
    setUser(null)
    queryClient.clear()
    toast.success('Logged out successfully!')
  }

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    await updateProfileMutation.mutateAsync(data)
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    await changePasswordMutation.mutateAsync({ currentPassword, newPassword })
  }

  // Initialize user from token on mount
  useEffect(() => {
    if (userData) {
      setUser(userData)
    }
  }, [userData])

  // Handle token expiration or invalid token
  useEffect(() => {
    if (error) {
      apiService.removeAuthToken()
      setUser(null)
    }
  }, [error])

  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}