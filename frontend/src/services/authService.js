import { apiClient } from './api'

export const authService = {
  login: async (credentials) => {
    return await apiClient.auth.login(credentials)
  },

  register: async (userData) => {
    return await apiClient.auth.register(userData)
  },

  logout: async () => {
    return await apiClient.auth.logout()
  },

  refreshToken: async (refreshToken) => {
    return await apiClient.auth.refresh(refreshToken)
  },

  getProfile: async () => {
    return await apiClient.auth.profile()
  },

  updateProfile: async (userData) => {
    return await apiClient.auth.updateProfile(userData)
  },
}
