import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: 5000, // Reduced timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Try to get token from localStorage first (fallback), then from auth store
    const token = localStorage.getItem('token') || useAuthStore.getState()?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    // Always return response.data.data if it exists, otherwise response.data
    if (response.data && response.data.data) {
      return response.data.data; // Return { user, token, refreshToken }
    } else if (response.data) {
      return response.data; // Return { success, data, message }
    } else {
      return response; // Return raw response if no data property
    }
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Try to refresh token using auth store
      const authStore = useAuthStore.getState();
      const refreshToken = localStorage.getItem('refreshToken') || authStore?.refreshToken;
      
      if (refreshToken) {
        try {
          const response = await axios.post('http://localhost:5001/api/auth/refresh', {
            refreshToken
          });
          
          // Handle refresh token response structure
          let token, newRefreshToken;
          if (response.data && response.data.data) {
            ({ token, refreshToken: newRefreshToken } = response.data.data);
          } else if (response.data) {
            ({ token, refreshToken: newRefreshToken } = response.data);
          }
          
          // Update both localStorage and auth store
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          if (authStore) {
            authStore.token = token;
            authStore.refreshToken = newRefreshToken;
          }
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          
          if (authStore) {
            authStore.clearAuth();
          }
          
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        if (authStore) {
          authStore.clearAuth();
        }
        
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  getMe: () => api.get('/auth/me'),
};

// Token API calls
export const tokenAPI = {
  bookToken: (tokenData) => api.post('/tokens/book', tokenData),
  getMyTokens: (params) => api.get(`/tokens/my-tokens${params ? `?${new URLSearchParams(params)}` : ''}`),
  getToken: (tokenId) => api.get(`/tokens/${tokenId}`),
  cancelToken: (tokenId) => api.put(`/tokens/${tokenId}/cancel`),
  checkInToken: (tokenId) => api.put(`/tokens/${tokenId}/checkin`),
  getQueueStatus: (branchId, departmentId) => api.get(`/tokens/queue/${branchId}${departmentId ? `/${departmentId}` : ''}`),
  searchTokens: (params) => api.get('/tokens/search', { params }),
  getStats: (params) => api.get('/tokens/stats', { params }),
  createWalkInToken: (tokenData) => api.post('/tokens/walk-in', tokenData),
};

// Queue API calls (for staff operations)
export const queueAPI = {
  getQueueStatus: (branchId, departmentId) => api.get(`/queue/${branchId}${departmentId ? `/${departmentId}` : ''}`),
  callNextToken: (counterId) => api.post('/queue/call-next', { counterId }),
  skipToken: (tokenId, reason) => api.put(`/queue/${tokenId}/skip`, { reason }),
  holdToken: (tokenId, reason) => api.put(`/queue/${tokenId}/hold`, { reason }),
  completeToken: (tokenId, serviceTime) => api.put(`/queue/${tokenId}/complete`, { serviceTime }),
  recallToken: (tokenId) => api.put(`/queue/${tokenId}/recall`),
  checkInToken: (tokenId) => api.put(`/queue/${tokenId}/checkin`),
  createWalkInToken: (tokenData) => api.post('/queue/walk-in', tokenData),
};

// Branch API calls
export const branchAPI = {
  getBranches: () => api.get('/branches'),
  getBranch: (branchId) => api.get(`/branches/${branchId}`),
  getBranchDepartments: (branchId) => api.get(`/branches/${branchId}/departments`),
  createBranch: (branchData) => api.post('/branches', branchData),
  updateBranch: (branchId, branchData) => api.put(`/branches/${branchId}`, branchData),
  deleteBranch: (branchId) => api.delete(`/branches/${branchId}`),
};

// Department API calls
export const departmentAPI = {
  getDepartments: (branchId) => api.get(`/departments${branchId ? `?branchId=${branchId}` : ''}`),
  getDepartment: (departmentId) => api.get(`/departments/${departmentId}`),
  createDepartment: (departmentData) => api.post('/departments', departmentData),
  updateDepartment: (departmentId, departmentData) => api.put(`/departments/${departmentId}`, departmentData),
  deleteDepartment: (departmentId) => api.delete(`/departments/${departmentId}`),
};

// Counter API calls
export const counterAPI = {
  getCounters: (branchId) => api.get(`/counters${branchId ? `?branchId=${branchId}` : ''}`),
  getCounter: (counterId) => api.get(`/counters/${counterId}`),
  createCounter: (counterData) => api.post('/counters', counterData),
  updateCounter: (counterId, counterData) => api.put(`/counters/${counterId}`, counterData),
  deleteCounter: (counterId) => api.delete(`/counters/${counterId}`),
};

// User API calls
export const userAPI = {
  getUsers: (filters) => api.get(`/users${filters ? `?${new URLSearchParams(filters)}` : ''}`),
  getUser: (userId) => api.get(`/users/${userId}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (userId, userData) => api.put(`/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/users/${userId}`),
};

// Analytics API calls
export const analyticsAPI = {
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getPerformance: (params) => api.get('/analytics/performance', { params }),
  getUserAnalytics: (params) => api.get('/analytics/users', { params }),
};

// Notification API calls
export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export default api;
