import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, 
  Building, 
  Settings, 
  BarChart3, 
  TrendingUp, 
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Queueless - Admin</h1>
            </div>
            <nav className="flex space-x-8">
              <Link to="/dashboard" className="text-primary-600 hover:text-primary-700">
                Dashboard
              </Link>
              <Link to="/admin" className="text-gray-600 hover:text-gray-900">
                Overview
              </Link>
              <Link to="/admin/analytics" className="text-gray-600 hover:text-gray-900">
                Analytics
              </Link>
              <Link to="/admin/users" className="text-gray-600 hover:text-gray-900">
                Users
              </Link>
              <Link to="/admin/branches" className="text-gray-600 hover:text-gray-900">
                Branches
              </Link>
              <Link to="/admin/counters" className="text-gray-600 hover:text-gray-900">
                Counters
              </Link>
              <Link to="/admin/settings" className="text-gray-600 hover:text-gray-900">
                Settings
              </Link>
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

        {/* System Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">1,247</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Total Users</h3>
            <p className="text-sm text-gray-600 mt-1">+12% from last month</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <Building className="h-8 w-8 text-success-600" />
              <span className="text-2xl font-bold text-gray-900">8</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Active Branches</h3>
            <p className="text-sm text-gray-600 mt-1">All operational</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="h-8 w-8 text-warning-600" />
              <span className="text-2xl font-bold text-gray-900">523</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Today's Tokens</h3>
            <p className="text-sm text-gray-600 mt-1">+8% from yesterday</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-8 w-8 text-error-600" />
              <span className="text-2xl font-bold text-gray-900">18</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Avg Wait Time</h3>
            <p className="text-sm text-gray-600 mt-1">Minutes</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            to="/users"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <Users className="h-8 w-8 text-primary-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Users</h3>
            <p className="text-sm text-gray-600">Add, edit, and remove users</p>
          </Link>

          <Link
            to="/branches"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <Building className="h-8 w-8 text-primary-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Branches</h3>
            <p className="text-sm text-gray-600">Configure locations and services</p>
          </Link>

          <Link
            to="/analytics"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <TrendingUp className="h-8 w-8 text-primary-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
            <p className="text-sm text-gray-600">View performance metrics</p>
          </Link>

          <Link
            to="/settings"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <Settings className="h-8 w-8 text-primary-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings</h3>
            <p className="text-sm text-gray-600">System configuration</p>
          </Link>
        </div>

        {/* System Status */}
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
                  <span className="text-sm text-warning-600">Degraded</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">New user registered</p>
                    <p className="text-xs text-gray-600">john.doe@email.com • 2 minutes ago</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-2 h-2 bg-success-600 rounded-full mt-2 mr-3"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Branch configuration updated</p>
                    <p className="text-xs text-gray-600">Main Branch • 15 minutes ago</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-2 h-2 bg-warning-600 rounded-full mt-2 mr-3"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">High queue volume detected</p>
                    <p className="text-xs text-gray-600">Downtown Branch • 1 hour ago</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-2 h-2 bg-error-600 rounded-full mt-2 mr-3"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">System backup completed</p>
                    <p className="text-xs text-gray-600">Automated • 2 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>
              <Link
                to="/analytics"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View Detailed Analytics
              </Link>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="mb-2">
                  <p className="text-3xl font-bold text-gray-900">94%</p>
                </div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-success-600 h-2 rounded-full" style={{ width: '94%' }}></div>
                </div>
              </div>

              <div className="text-center">
                <div className="mb-2">
                  <p className="text-3xl font-bold text-gray-900">8.5</p>
                </div>
                <p className="text-sm text-gray-600">Avg Service Time (min)</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-warning-600 h-2 rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>

              <div className="text-center">
                <div className="mb-2">
                  <p className="text-3xl font-bold text-gray-900">4.8</p>
                </div>
                <p className="text-sm text-gray-600">Customer Satisfaction</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-primary-600 h-2 rounded-full" style={{ width: '96%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
