import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export const useAuth = () => {
  const navigate = useNavigate()
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshToken: refreshAuthToken,
    updateProfile,
    clearAuth
  } = useAuthStore()

  // Auto-logout on token expiry
  useEffect(() => {
    const handleTokenExpired = () => {
      toast.error('Session expired. Please login again.')
      clearAuth()
      navigate('/login')
    }

    // Listen for token expiry events
    window.addEventListener('tokenExpired', handleTokenExpired)

    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpired)
    }
  }, [clearAuth, navigate])

  // Login with error handling
  const handleLogin = async (credentials) => {
    try {
      const result = await login(credentials)
      toast.success('Login successful!')
      return result
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      throw error
    }
  }

  // Register with error handling
  const handleRegister = async (userData) => {
    try {
      const result = await register(userData)
      toast.success('Registration successful!')
      return result
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      toast.error(message)
      throw error
    }
  }

  // Logout with confirmation
  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out successfully')
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Force logout even if API call fails
      clearAuth()
      navigate('/login')
    }
  }

  // Update profile with error handling
  const handleUpdateProfile = async (userData) => {
    try {
      const result = await updateProfile(userData)
      toast.success('Profile updated successfully!')
      return result
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed'
      toast.error(message)
      throw error
    }
  }

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role
  }

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role)
  }

  // Check if user has specific permission
  const hasPermission = (permission) => {
    const rolePermissions = {
      user: ['book_token', 'view_queue_status'],
      staff: ['book_token', 'view_queue_status', 'create_walk_in', 'control_queue'],
      operator: ['view_queue_status', 'control_queue'],
      admin: ['*'] // All permissions
    }
    
    const userPermissions = rolePermissions[user?.role] || []
    return userPermissions.includes('*') || userPermissions.includes(permission)
  }

  // Get user display name
  const getDisplayName = () => {
    return user?.name || 'Unknown User'
  }

  // Get user initials
  const getInitials = () => {
    if (!user?.name) return 'U'
    return user.name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2)
  }

  // Check if user is assigned to a branch
  const isAssignedToBranch = () => {
    return !!user?.assignedBranch
  }

  // Check if user is assigned to a counter
  const isAssignedToCounter = () => {
    return !!user?.assignedCounter
  }

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    updateProfile: handleUpdateProfile,
    refreshToken: refreshAuthToken,
    clearAuth,
    hasRole,
    hasAnyRole,
    hasPermission,
    getDisplayName,
    getInitials,
    isAssignedToBranch,
    isAssignedToCounter
  }
}
