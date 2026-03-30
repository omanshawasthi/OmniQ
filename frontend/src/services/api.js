import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh the token
        const refreshResponse = await useAuthStore.getState().refreshToken()
        if (refreshResponse) {
          // Retry the original request
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    // Handle other errors
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred'
    
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.')
    } else if (error.response?.status === 404) {
      toast.error('The requested resource was not found.')
    } else if (!originalRequest._retry) {
      toast.error(errorMessage)
    }

    return Promise.reject(error)
  }
)

// API methods
export const apiClient = {
  // Auth
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
    profile: () => api.get('/auth/profile'),
    updateProfile: (userData) => api.put('/auth/profile', userData),
  },

  // Tokens
  tokens: {
    book: (tokenData) => api.post('/tokens/book', tokenData),
    getMyTokens: () => api.get('/tokens/my-tokens'),
    getToken: (tokenId) => api.get(`/tokens/${tokenId}`),
    cancelToken: (tokenId) => api.put(`/tokens/${tokenId}/cancel`),
    createWalkIn: (tokenData) => api.post('/tokens/walk-in', tokenData),
    searchTokens: (query) => api.get('/tokens/search', { params: query }),
  },

  // Queue
  queue: {
    getStatus: (branchId, departmentId) => api.get(`/queue/status/${branchId}/${departmentId}`),
    callNext: (counterId) => api.post('/queue/call-next', { counterId }),
    skipToken: (tokenId, reason) => api.post(`/queue/skip/${tokenId}`, { reason }),
    holdToken: (tokenId, reason) => api.post(`/queue/hold/${tokenId}`, { reason }),
    completeToken: (tokenId, serviceTime) => api.post(`/queue/complete/${tokenId}`, { serviceTime }),
    recallToken: (tokenId) => api.post(`/queue/recall/${tokenId}`),
    checkInToken: (tokenId) => api.post(`/queue/check-in/${tokenId}`),
  },

  // Branches
  branches: {
    getAll: () => api.get('/branches'),
    getById: (id) => api.get(`/branches/${id}`),
    create: (branchData) => api.post('/branches', branchData),
    update: (id, branchData) => api.put(`/branches/${id}`, branchData),
    delete: (id) => api.delete(`/branches/${id}`),
  },

  // Departments
  departments: {
    getAll: (branchId) => api.get('/departments', { params: { branchId } }),
    getById: (id) => api.get(`/departments/${id}`),
    create: (departmentData) => api.post('/departments', departmentData),
    update: (id, departmentData) => api.put(`/departments/${id}`, departmentData),
    delete: (id) => api.delete(`/departments/${id}`),
  },

  // Counters
  counters: {
    getAll: (branchId, departmentId) => api.get('/counters', { params: { branchId, departmentId } }),
    getById: (id) => api.get(`/counters/${id}`),
    create: (counterData) => api.post('/counters', counterData),
    update: (id, counterData) => api.put(`/counters/${id}`, counterData),
    delete: (id) => api.delete(`/counters/${id}`),
    updateStatus: (id, status) => api.put(`/counters/${id}/status`, { status }),
  },

  // Users
  users: {
    getAll: (params) => api.get('/users', { params }),
    getById: (id) => api.get(`/users/${id}`),
    create: (userData) => api.post('/users', userData),
    update: (id, userData) => api.put(`/users/${id}`, userData),
    delete: (id) => api.delete(`/users/${id}`),
  },

  // Analytics
  analytics: {
    getDashboard: (params) => api.get('/analytics/dashboard', { params }),
    getTokenStats: (params) => api.get('/analytics/tokens/stats', { params }),
    getQueuePerformance: (params) => api.get('/analytics/queues/performance', { params }),
    getDailyReport: (date) => api.get('/analytics/reports/daily', { params: { date } }),
    getWeeklyReport: (startDate, endDate) => api.get('/analytics/reports/weekly', { params: { startDate, endDate } }),
  },

  // Notifications
  notifications: {
    getMyNotifications: (params) => api.get('/notifications', { params }),
    markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
    getUnreadCount: () => api.get('/notifications/unread-count'),
  },
}

export default api
