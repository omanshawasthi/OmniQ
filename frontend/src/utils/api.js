import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Read from Zustand store (source of truth after persist rehydration)
    const token = useAuthStore.getState()?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — unwrap data + handle 401 ──────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    // Unwrap { success, data: { ... } } → return inner data directly
    if (response.data?.data !== undefined) return response.data.data;
    if (response.data !== undefined) return response.data;
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue up requests while refresh is in-flight
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const authStore = useAuthStore.getState();
      const refreshToken = authStore?.storedRefreshToken;

      if (refreshToken) {
        try {
          const resp = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/refresh`,
            { refreshToken }
          );
          const newToken =
            resp.data?.data?.token ||
            resp.data?.token ||
            resp.data?.accessToken;

          if (newToken) {
            useAuthStore.getState().token = newToken; // direct update before store action
            authStore.refreshAccessToken && await authStore.refreshAccessToken();
            processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            isRefreshing = false;
            return api(originalRequest);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;
          useAuthStore.getState().clearAuth();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        isRefreshing = false;
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  getMe: () => api.get('/auth/profile'),
};

// ── Dashboard API (user side) ─────────────────────────────────────────────────
export const dashboardAPI = {
  // Active tokens: status=WAITING or SERVING (uppercase to match backend enum)
  getActiveTokens: () =>
    api.get('/tokens/my-tokens', { params: { status: 'WAITING,SERVING', limit: 1 } }),
  // All tokens for stats + recent history
  getMyTokens: (params = {}) => api.get('/tokens/my-tokens', { params }),
  // Current user profile
  getCurrentUser: () => api.get('/auth/profile'),
};

// ── Token API ─────────────────────────────────────────────────────────────────
export const tokenAPI = {
  bookToken: (tokenData) => api.post('/tokens/book', tokenData),
  getMyTokens: (params) => api.get('/tokens/my-tokens', { params }),
  getToken: (tokenId) => api.get(`/tokens/${tokenId}`),
  cancelToken: (tokenId) => api.put(`/tokens/${tokenId}/cancel`),
  checkInToken: (tokenId) => api.put(`/tokens/${tokenId}/checkin`),
  getQueueStatus: (branchId, departmentId) =>
    api.get(`/tokens/queue/${branchId}${departmentId ? `/${departmentId}` : ''}`),
  searchTokens: (params) => api.get('/tokens/search', { params }),
  getStats: (params) => api.get('/tokens/stats', { params }),
  createWalkInToken: (tokenData) => api.post('/tokens/walk-in', tokenData),
};

// ── Queue API (staff operations) ──────────────────────────────────────────────
export const queueAPI = {
  getQueueStatus: (branchId, departmentId) =>
    api.get(`/queue/${branchId}${departmentId ? `/${departmentId}` : ''}`),
  callNextToken: (counterId) => api.post('/queue/call-next', { counterId }),
  skipToken: (tokenId, reason) => api.put(`/queue/${tokenId}/skip`, { reason }),
  holdToken: (tokenId, reason) => api.put(`/queue/${tokenId}/hold`, { reason }),
  completeToken: (tokenId, serviceTime) =>
    api.put(`/queue/${tokenId}/complete`, { serviceTime }),
  recallToken: (tokenId) => api.put(`/queue/${tokenId}/recall`),
  checkInToken: (tokenId) => api.put(`/queue/${tokenId}/checkin`),
  createWalkInToken: (tokenData) => api.post('/queue/walk-in', tokenData),
};

// ── Branch API ────────────────────────────────────────────────────────────────
export const branchAPI = {
  getBranches: () => api.get('/branches'),
  getBranch: (branchId) => api.get(`/branches/${branchId}`),
  getBranchDepartments: (branchId) => api.get(`/branches/${branchId}/departments`),
  createBranch: (branchData) => api.post('/branches', branchData),
  updateBranch: (branchId, branchData) => api.put(`/branches/${branchId}`, branchData),
  deleteBranch: (branchId) => api.delete(`/branches/${branchId}`),
};

// ── Department API ────────────────────────────────────────────────────────────
export const departmentAPI = {
  getDepartments: (branchId) =>
    api.get('/departments', { params: branchId ? { branchId } : {} }),
  getDepartment: (departmentId) => api.get(`/departments/${departmentId}`),
  createDepartment: (departmentData) => api.post('/departments', departmentData),
  updateDepartment: (departmentId, departmentData) =>
    api.put(`/departments/${departmentId}`, departmentData),
  deleteDepartment: (departmentId) => api.delete(`/departments/${departmentId}`),
};

// ── Counter API ───────────────────────────────────────────────────────────────
export const counterAPI = {
  getCounters: (branchId) =>
    api.get('/counters', { params: branchId ? { branchId } : {} }),
  getCounter: (counterId) => api.get(`/counters/${counterId}`),
  createCounter: (counterData) => api.post('/counters', counterData),
  updateCounter: (counterId, counterData) => api.put(`/counters/${counterId}`, counterData),
  deleteCounter: (counterId) => api.delete(`/counters/${counterId}`),
};

// ── User API ──────────────────────────────────────────────────────────────────
export const userAPI = {
  getUsers: (filters) => api.get('/users', { params: filters }),
  getUser: (userId) => api.get(`/users/${userId}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (userId, userData) => api.put(`/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/users/${userId}`),
};

// ── Analytics API ─────────────────────────────────────────────────────────────
export const analyticsAPI = {
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getPerformance: (params) => api.get('/analytics/performance', { params }),
  getUserAnalytics: (params) => api.get('/analytics/users', { params }),
};

// ── Notification API ──────────────────────────────────────────────────────────
export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export default api;
