import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import ProtectedRoute from './components/common/ProtectedRoute'
import Layout from './components/Layout'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import UserDashboard from './pages/UserDashboard'
import BookTokenPage from './pages/user/BookTokenPage'
import HistoryPage from './pages/user/HistoryPage'
import ProfilePage from './pages/user/ProfilePage'
import ActiveTokenPage from './pages/user/ActiveTokenPage'

// Admin pages
import AdminDashboard from './pages/AdminDashboard'
import UsersPage from './pages/admin/UsersPage'
import BranchesPage from './pages/admin/BranchesPage'
import CountersPage from './pages/admin/CountersPage'
import SettingsPage from './pages/admin/SettingsPage'
import QueueManagementPage from './pages/admin/QueueManagementPage'
import Analytics from './components/admin/Analytics'

// Staff pages
import StaffDashboard from './pages/StaffDashboard'
import WalkInPage from './pages/staff/WalkInPage'
import QueueControlPage from './pages/staff/QueueControlPage'

// Operator pages
import OperatorDashboard from './pages/OperatorDashboard'
import AssignedQueuePage from './pages/operator/AssignedQueuePage'
import ServeTokenPage from './pages/operator/ServeTokenPage'

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* User Routes */}
          <Route 
            path="/user" 
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <UserDashboard />
              </ProtectedRoute>
            } 
          />
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
          
          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/analytics" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Analytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <UsersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/branches" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <BranchesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/counters" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <CountersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/queue" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                <QueueManagementPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/settings" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <SettingsPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Staff Routes */}
          <Route 
            path="/staff" 
            element={
              <ProtectedRoute allowedRoles={['STAFF']}>
                <StaffDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/staff/walk-in" 
            element={
              <ProtectedRoute allowedRoles={['STAFF']}>
                <WalkInPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/staff/queue-control" 
            element={
              <ProtectedRoute allowedRoles={['STAFF']}>
                <QueueControlPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Operator Routes */}
          <Route 
            path="/operator" 
            element={
              <ProtectedRoute allowedRoles={['OPERATOR']}>
                <OperatorDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/operator/assigned-queue" 
            element={
              <ProtectedRoute allowedRoles={['OPERATOR']}>
                <AssignedQueuePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/operator/serve-token" 
            element={
              <ProtectedRoute allowedRoles={['OPERATOR']}>
                <ServeTokenPage />
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<Layout><HomePage /></Layout>} />
        </Routes>
      </div>
  )
}

export default App
