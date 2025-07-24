import { apiService, ApiResponse } from './api'

// Transaction service placeholder
class TransactionService {
  // Get all transactions
  async getTransactions(params?: any): Promise<ApiResponse<any>> {
    return apiService.get('/transactions', { params })
  }

  // Create transaction
  async createTransaction(data: any): Promise<ApiResponse<any>> {
    return apiService.post('/transactions', data)
  }

  // Update transaction
  async updateTransaction(id: string, data: any): Promise<ApiResponse<any>> {
    return apiService.put(`/transactions/${id}`, data)
  }

  // Delete transaction
  async deleteTransaction(id: string): Promise<ApiResponse<any>> {
    return apiService.delete(`/transactions/${id}`)
  }
}

export const transactionService = new TransactionService()