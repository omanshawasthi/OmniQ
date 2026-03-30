import React, { useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'

export const AuthProvider = ({ children }) => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth)

  useEffect(() => {
    // Initialize auth state from localStorage on app load
    initializeAuth()
  }, [initializeAuth])

  return <>{children}</>
}

export default AuthProvider
