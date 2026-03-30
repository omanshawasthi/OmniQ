import React from 'react'
import { Link } from 'react-router-dom'
import { Users, Plus, Search, Settings, BarChart3, Clock } from 'lucide-react'

const StaffDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Queueless - Staff</h1>
            </div>
            <nav className="flex space-x-8">
              <Link to="/dashboard" className="text-primary-600 hover:text-primary-700">
                Dashboard
              </Link>
              <Link to="/staff" className="text-gray-600 hover:text-gray-900">
                Overview
              </Link>
              <Link to="/staff/walk-in" className="text-gray-600 hover:text-gray-900">
                Walk-in
              </Link>
              <Link to="/staff/queue-control" className="text-gray-600 hover:text-gray-900">
                Queue Control
              </Link>
              <Link to="/staff/search" className="text-gray-600 hover:text-gray-900">
                Search
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Staff Dashboard</h2>
          <p className="text-gray-600">Manage queues and assist customers</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">24</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Waiting</h3>
            <p className="text-sm text-gray-600 mt-1">Currently in queue</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-8 w-8 text-success-600" />
              <span className="text-2xl font-bold text-success-600">8</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Serving</h3>
            <p className="text-sm text-gray-600 mt-1">Being served now</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="h-8 w-8 text-warning-600" />
              <span className="text-2xl font-bold text-gray-900">45</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Completed</h3>
            <p className="text-sm text-gray-600 mt-1">Today's total</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <Plus className="h-8 w-8 text-error-600" />
              <span className="text-2xl font-bold text-gray-900">12</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Walk-ins</h3>
            <p className="text-sm text-gray-600 mt-1">Today's walk-ins</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            to="/walk-in"
            className="bg-primary-600 text-white p-6 rounded-lg shadow-sm hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-8 w-8 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Create Walk-in Token</h3>
            <p className="text-sm opacity-90">Generate token for walk-in customers</p>
          </Link>

          <Link
            to="/queue-control"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <Users className="h-8 w-8 text-primary-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Queue Control</h3>
            <p className="text-sm text-gray-600">Manage and control queue flow</p>
          </Link>

          <Link
            to="/search"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <Search className="h-8 w-8 text-primary-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Search Tokens</h3>
            <p className="text-sm text-gray-600">Find and manage specific tokens</p>
          </Link>
        </div>

        {/* Current Queue Status */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Current Queue</h3>
              <Link
                to="/queue-control"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Manage Queue
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Token
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Wait Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">A001</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">John Doe</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">General Services</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success-100 text-success-800">
                        Serving
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      5 min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-primary-600 hover:text-primary-900 mr-3">
                        Complete
                      </button>
                      <button className="text-warning-600 hover:text-warning-900">
                        Hold
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">A002</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">Jane Smith</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">Banking Services</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
                        Waiting
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      12 min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-primary-600 hover:text-primary-900 mr-3">
                        Call
                      </button>
                      <button className="text-error-600 hover:text-error-900">
                        Skip
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">A003</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">Bob Johnson</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">Document Services</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-warning-100 text-warning-800">
                        Held
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      18 min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-primary-600 hover:text-primary-900 mr-3">
                        Resume
                      </button>
                      <button className="text-error-600 hover:text-error-900">
                        Cancel
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center mr-4">
                    <Users className="h-5 w-5 text-success-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Token A001 Called</p>
                    <p className="text-sm text-gray-600">John Doe - General Services</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">2 minutes ago</p>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                    <Plus className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Walk-in Token Created</p>
                    <p className="text-sm text-gray-600">A004 - Sarah Wilson</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">5 minutes ago</p>
                </div>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-warning-100 rounded-full flex items-center justify-center mr-4">
                    <Clock className="h-5 w-5 text-warning-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Token A003 Held</p>
                    <p className="text-sm text-gray-600">Bob Johnson - Document Services</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">10 minutes ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default StaffDashboard
