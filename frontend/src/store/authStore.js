import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '../utils/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false,
      isInitialized: false, // Add initialization state

      // Actions
      login: async (credentials) => {
        set({ isLoading: true })
        try {
          const response = await authAPI.login(credentials)
          
          // The interceptor returns response.data directly
          if (response && response.user && response.token) {
            const { user, token, refreshToken } = response
            set({ 
              user, 
              token, 
              refreshToken, 
              isLoading: false, 
              isAuthenticated: true,
              isInitialized: true
            })
          } else {
            throw new Error('Invalid response structure: missing user or token')
          }
          
          return response
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (userData) => {
        set({ isLoading: true })
        try {
          const response = await authAPI.register(userData)
          set({ isLoading: false })
          return response
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          // Clear localStorage first
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isInitialized: true,
          })
        } catch (error) {
          console.error('Logout error:', error)
          // Still clear auth state even if logout API fails
          get().clearAuth()
        }
      },

      refreshToken: async () => {
        const { refreshToken } = get()
        if (!refreshToken) {
          get().logout()
          return
        }

        try {
          const response = await authAPI.refreshToken(refreshToken)
          
          // Handle different response structures
          let newToken, newRefreshToken;
          if (response.data) {
            if (response.data.data) {
              ({ token: newToken, refreshToken: newRefreshToken } = response.data.data);
            } else {
              ({ token: newToken, refreshToken: newRefreshToken } = response.data);
            }
          } else {
            ({ token: newToken, refreshToken: newRefreshToken } = response);
          }
          
          set({
            token: newToken,
            refreshToken: newRefreshToken,
          })
          
          // Update localStorage too
          localStorage.setItem('token', newToken)
          localStorage.setItem('refreshToken', newRefreshToken)
          
          return response
        } catch (error) {
          get().logout()
          throw error
        }
      },

      updateProfile: async (userData) => {
        set({ isLoading: true })
        try {
          const response = await authAPI.getMe()
          
          // Handle different response structures
          let updatedUser;
          if (response.data) {
            if (response.data.data) {
              updatedUser = response.data.data.user;
            } else if (response.data.user) {
              updatedUser = response.data.user;
            } else {
              updatedUser = response.data;
            }
          } else {
            updatedUser = response.user;
          }
          
          set({
            user: { ...get().user, ...updatedUser },
            isLoading: false,
          })
          
          return response
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      clearAuth: () => {
        // Clear localStorage
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isInitialized: true,
        })
      },

      // Initialize auth state from localStorage
      initializeAuth: () => {
        try {
          const token = localStorage.getItem('token')
          const refreshToken = localStorage.getItem('refreshToken')
          const userStr = localStorage.getItem('user')
          
          if (token && userStr) {
            const user = JSON.parse(userStr)
            set({
              user,
              token,
              refreshToken,
              isAuthenticated: true,
              isInitialized: true,
            })
          } else {
            set({ isInitialized: true })
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error)
          set({ isInitialized: true })
        }
      },

      // Getters
      hasRole: (role) => {
        const { user } = get()
        return user?.role === role
      },

      hasAnyRole: (roles) => {
        const { user } = get()
        return roles.includes(user?.role)
      },

      can: (permission) => {
        const { user } = get()
        // This will be implemented based on role permissions
        const rolePermissions = {
          user: ['book_token', 'view_queue_status'],
          staff: ['book_token', 'view_queue_status', 'create_walk_in', 'control_queue'],
          operator: ['view_queue_status', 'control_queue'],
          admin: ['*'], // All permissions
        }
        
        const userPermissions = rolePermissions[user?.role] || []
        return userPermissions.includes('*') || userPermissions.includes(permission)
      },
    }),
    {
      name: 'queueless-auth',
      storage: {
        getItem: (name) => {
          const item = localStorage.getItem(name);
          return item ? JSON.parse(item) : null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        }
      },
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        isInitialized: state.isInitialized,
      }),
    }
  )
)
