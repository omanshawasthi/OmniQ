import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import ProtectedRoute from './components/common/ProtectedRoute'
import Layout from './components/Layout'
import { Loader2 } from 'lucide-react'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import UserDashboard from './pages/UserDashboard'
import BookTokenPage from './pages/user/BookTokenPage'
import HistoryPage from './pages/user/HistoryPage'
import ProfilePage from './pages/user/ProfilePage'
import ActiveTokenPage from './pages/user/ActiveTokenPage'
import TokenDetailsPage from './pages/user/TokenDetailsPage'
import LiveQueuePage from './pages/user/LiveQueuePage'

// Admin pages
import AdminDashboard from './pages/AdminDashboard'
import UsersPage from './pages/admin/UsersPage'
import BranchesPage from './pages/admin/BranchesPage'
import CountersPage from './pages/admin/CountersPage'
import SettingsPage from './pages/admin/SettingsPage'
import QueueManagementPage from './pages/admin/QueueManagementPage'
import Analytics from './components/admin/Analytics'

// Staff pages
import StaffDashboardPage from './pages/staff/StaffDashboardPage'
import StaffQueuePage from './pages/staff/StaffQueuePage'
import WalkInPage from './pages/staff/WalkInPage'
import QueueControlPage from './pages/staff/QueueControlPage'

// Operator pages
import OperatorDashboard from './pages/OperatorDashboard'
import AssignedQueuePage from './pages/operator/AssignedQueuePage'
import ServeTokenPage from './pages/operator/ServeTokenPage'

// Guest-only wrapper: redirect authenticated users to their dashboard
const GuestRoute = ({ children }) => {
  const { isAuthenticated, user, isInitialized } = useAuthStore()
  if (!isInitialized) return null
  if (isAuthenticated && user) {
    const roleRoutes = {
      ADMIN: '/admin',
      STAFF: '/staff',
      OPERATOR: '/operator',
      USER: '/dashboard',
    }
    const normalizedRole = (user.role || '').toUpperCase()
    return <Navigate to={roleRoutes[normalizedRole] || '/dashboard'} replace />
  }
  return children
}

function App() {
  const { isInitialized } = useAuthStore()

  // Block render until Zustand persisted state has hydrated
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<Layout><HomePage /></Layout>} />

        {/* Guest-only routes — redirect logged-in users away */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

        {/* User Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['USER']}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        {/* Legacy /user → /dashboard */}
        <Route path="/user" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/user/book-token"
          element={
            <ProtectedRoute allowedRoles={['USER']}>
              <BookTokenPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/history"
          element={
            <ProtectedRoute allowedRoles={['USER']}>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/my-tokens"
          element={
            <ProtectedRoute allowedRoles={['USER']}>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/active-token"
          element={
            <ProtectedRoute allowedRoles={['USER']}>
              <ActiveTokenPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/profile"
          element={
            <ProtectedRoute allowedRoles={['USER']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/live-queue/:id"
          element={
            <ProtectedRoute allowedRoles={['USER', 'STAFF', 'ADMIN', 'OPERATOR']}>
              <LiveQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/token/:id"
          element={
            <ProtectedRoute allowedRoles={['USER', 'STAFF', 'ADMIN', 'OPERATOR']}>
              <TokenDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['ADMIN']}><Analytics /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><UsersPage /></ProtectedRoute>} />
        <Route path="/admin/branches" element={<ProtectedRoute allowedRoles={['ADMIN']}><BranchesPage /></ProtectedRoute>} />
        <Route path="/admin/counters" element={<ProtectedRoute allowedRoles={['ADMIN']}><CountersPage /></ProtectedRoute>} />
        <Route path="/admin/queue" element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}><QueueManagementPage /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['ADMIN']}><SettingsPage /></ProtectedRoute>} />

        {/* Staff Routes */}
        <Route path="/staff" element={<ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}><StaffDashboardPage /></ProtectedRoute>} />
        <Route path="/staff/queue" element={<ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}><StaffQueuePage /></ProtectedRoute>} />
        <Route path="/staff/walk-in" element={<ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}><WalkInPage /></ProtectedRoute>} />
        <Route path="/staff/queue-control" element={<ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}><QueueControlPage /></ProtectedRoute>} />

        {/* Operator Routes */}
        <Route path="/operator" element={<ProtectedRoute allowedRoles={['OPERATOR']}><OperatorDashboard /></ProtectedRoute>} />
        <Route path="/operator/assigned-queue" element={<ProtectedRoute allowedRoles={['OPERATOR']}><AssignedQueuePage /></ProtectedRoute>} />
        <Route path="/operator/serve-token" element={<ProtectedRoute allowedRoles={['OPERATOR']}><ServeTokenPage /></ProtectedRoute>} />

        <Route path="*" element={<Layout><HomePage /></Layout>} />
      </Routes>
    </div>
  )
}

export default App
