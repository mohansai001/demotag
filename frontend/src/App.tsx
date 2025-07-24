import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'

import { useAuth } from '@contexts/AuthContext'
import Layout from '@components/layout/Layout'
import LoadingSpinner from '@components/common/LoadingSpinner'

// Pages
import LoginPage from '@pages/auth/LoginPage'
import RegisterPage from '@pages/auth/RegisterPage'
import DashboardPage from '@pages/dashboard/DashboardPage'
import TransactionsPage from '@pages/transactions/TransactionsPage'
import AnalyticsPage from '@pages/analytics/AnalyticsPage'
import ProfilePage from '@pages/profile/ProfilePage'

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <LoadingSpinner size={60} />
      </Box>
    )
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />
}

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <LoadingSpinner size={60} />
      </Box>
    )
  }

  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App