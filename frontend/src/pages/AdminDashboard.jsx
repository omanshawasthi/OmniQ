import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { 
  Users, 
  Building, 
  Settings, 
  BarChart3, 
  TrendingUp, 
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  ListOrdered,
  LogOut
} from 'lucide-react'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const handleSignOut = () => {
    logout()
    navigate('/login')
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminOverview'],
    queryFn: async () => {
      const response = await apiClient.admin.getOverview();
      return response.data.data;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Queueless - Admin</h1>
            </div>
            <nav className="flex items-center space-x-6">
              <Link to="/admin" className="text-gray-600 hover:text-gray-900 text-sm">
                Overview
              </Link>
              <Link to="/admin/analytics" className="text-gray-600 hover:text-gray-900 text-sm">
                Analytics
              </Link>
              <Link to="/admin/users" className="text-gray-600 hover:text-gray-900 text-sm">
                Users
              </Link>
              <Link to="/admin/branches" className="text-gray-600 hover:text-gray-900 text-sm">
                Branches
              </Link>
              <Link to="/admin/counters" className="text-gray-600 hover:text-gray-900 text-sm">
                Counters
              </Link>
              <Link to="/admin/settings" className="text-gray-600 hover:text-gray-900 text-sm">
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium ml-2 border-l pl-4 border-gray-200"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
          <p className="text-gray-600">System overview and management</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Loading system overview...</p>
          </div>
        ) : isError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-6 rounded-lg text-center font-medium">
            Failed to load the system overview. Please check your network or try again later.
          </div>
        ) : (
          <>
            {/* System Stats */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <Users className="h-8 w-8 text-primary-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    {data?.system?.totalUsers || 0}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Total Users</h3>
                <p className="text-sm text-gray-600 mt-1">Registered accounts</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <Building className="h-8 w-8 text-success-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    {data?.system?.totalBranches || 0}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Active Branches</h3>
                <p className="text-sm text-gray-600 mt-1">All operational</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <BarChart3 className="h-8 w-8 text-warning-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    {data?.today?.totalTokens || 0}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Today's Tokens</h3>
                <p className="text-sm text-gray-600 mt-1">Walk-ins: {data?.today?.walkInTokens} | Online: {data?.today?.onlineTokens}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="h-8 w-8 text-error-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    {data?.today?.avgWaitTime || 0}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Avg Wait Time</h3>
                <p className="text-sm text-gray-600 mt-1">Minutes (Today)</p>
              </div>
            </div>

            {/* Token Progress (Today) */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
                <h4 className="text-sm text-gray-500 font-medium uppercase">Waiting</h4>
                <p className="text-3xl font-bold text-gray-900 mt-2">{data?.today?.waitingTokens}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border text-center line-clamp-1">
                <h4 className="text-sm text-gray-500 font-medium uppercase">Serving</h4>
                <p className="text-3xl font-bold text-blue-600 mt-2">{data?.today?.servingTokens}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
                <h4 className="text-sm text-gray-500 font-medium uppercase">Completed</h4>
                <p className="text-3xl font-bold text-success-600 mt-2">{data?.today?.completedTokens}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
                <h4 className="text-sm text-gray-500 font-medium uppercase">Missed/Skipped</h4>
                <p className="text-3xl font-bold text-warning-600 mt-2">
                  {(data?.today?.missedTokens || 0) + (data?.today?.skippedTokens || 0)}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Link
                to="/admin/users"
                className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
              >
                <Users className="h-8 w-8 text-primary-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Users</h3>
                <p className="text-sm text-gray-600">Add, edit, and remove users</p>
              </Link>

              <Link
                to="/admin/branches"
                className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
              >
                <Building className="h-8 w-8 text-primary-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Branches</h3>
                <p className="text-sm text-gray-600">Configure locations and services</p>
              </Link>

              <Link
                to="/admin/analytics"
                className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
              >
                <TrendingUp className="h-8 w-8 text-primary-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
                <p className="text-sm text-gray-600">View performance metrics</p>
              </Link>

              <Link
                to="/admin/counters"
                className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
              >
                <ListOrdered className="h-8 w-8 text-primary-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Counters</h3>
                <p className="text-sm text-gray-600">Setup and assign counters</p>
              </Link>
            </div>

            {/* Additional Info / Status */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-success-600 mr-3" />
                        <span className="text-gray-900">Database</span>
                      </div>
                      <span className="text-sm text-success-600">Operational</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-success-600 mr-3" />
                        <span className="text-gray-900">API Server</span>
                      </div>
                      <span className="text-sm text-success-600">Operational</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-success-600 mr-3" />
                        <span className="text-gray-900">Socket.IO</span>
                      </div>
                      <span className="text-sm text-success-600">Operational</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-warning-600 mr-3" />
                        <span className="text-gray-900">Email Service</span>
                      </div>
                      <span className="text-sm text-warning-600">Degraded (Test Environment)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Infrastructure Specs</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Departments Configured</p>
                        <p className="text-xs text-gray-600">{data?.system?.totalDepartments || 0} total active departments in operations.</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Counters Tracked</p>
                        <p className="text-xs text-gray-600">{data?.system?.totalCounters || 0} total physical counters capable of token processing.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default AdminDashboard
