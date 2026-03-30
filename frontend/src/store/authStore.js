import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '../utils/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // ── State ──────────────────────────────────────────────────────────────
      user: null,
      token: null,
      storedRefreshToken: null, // avoid name collision with refreshAccessToken action
      isLoading: false,
      isAuthenticated: false,
      isInitialized: false,

      // ── Actions ────────────────────────────────────────────────────────────
      login: async (credentials) => {
        set({ isLoading: true })
        try {
          // api interceptor unwraps data.data → { user, token, refreshToken }
          const response = await authAPI.login(credentials)

          const user = response?.user
          const token = response?.token || response?.accessToken
          const refreshToken = response?.refreshToken

          if (!user || !token) {
            throw new Error('Invalid response from server — missing user or token')
          }

          set({
            user,
            token,
            storedRefreshToken: refreshToken ?? null,
            isLoading: false,
            isAuthenticated: true,
            isInitialized: true,
          })

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

      logout: () => {
        set({
          user: null,
          token: null,
          storedRefreshToken: null,
          isAuthenticated: false,
          isInitialized: true,
        })
      },

      // Renamed from 'refreshToken' to prevent collision with the state field
      refreshAccessToken: async () => {
        const { storedRefreshToken } = get()
        if (!storedRefreshToken) {
          get().logout()
          return
        }
        try {
          const response = await authAPI.refreshToken(storedRefreshToken)
          const newToken = response?.token || response?.accessToken
          const newRefreshToken = response?.refreshToken || storedRefreshToken
          set({ token: newToken, storedRefreshToken: newRefreshToken })
          return response
        } catch (error) {
          get().logout()
          throw error
        }
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          storedRefreshToken: null,
          isAuthenticated: false,
          isInitialized: true,
        })
      },

      setUser: (user) => set({ user }),

      // ── Getters ────────────────────────────────────────────────────────────
      hasRole: (role) => get().user?.role === role,
      hasAnyRole: (roles) => roles.includes(get().user?.role),
    }),
    {
      name: 'queueless-auth',
      storage: {
        getItem: (name) => {
          try {
            const item = localStorage.getItem(name)
            return item ? JSON.parse(item) : null
          } catch {
            return null
          }
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => {
          localStorage.removeItem(name)
        },
      },
      // Only persist auth-critical fields — never persist isInitialized
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        storedRefreshToken: state.storedRefreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Always mark initialized after rehydration
          state.isInitialized = true
          // Validate: if token or user is missing, clear auth so UI doesn't show stale state
          if (!state.token || !state.user) {
            state.isAuthenticated = false
          }
        }
      },
    }
  )
)
