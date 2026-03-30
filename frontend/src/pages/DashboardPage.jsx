import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, History, QrCode, Bell, User, Users, TrendingUp, Settings } from 'lucide-react'

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-semibold text-gray-900">Queueless</span>
              </Link>
            </div>
            <nav className="flex space-x-8">
              <Link to="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
                Dashboard
              </Link>
              <Link to="/book-token" className="text-gray-600 hover:text-gray-900 font-medium">
                Book Token
              </Link>
              <Link to="/history" className="text-gray-600 hover:text-gray-900 font-medium">
                History
              </Link>
              <Link to="/profile" className="text-gray-600 hover:text-gray-900 font-medium">
                Profile
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">John Doe</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, John!</h1>
          <p className="text-gray-600">Manage your tokens and track queue status</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            to="/book-token"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <Calendar className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">+</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Book Token</h3>
            <p className="text-sm text-gray-600 mt-1">Schedule your visit</p>
          </Link>

          <Link
            to="/queue-status"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-8 w-8 text-green-600" />
              <span className="text-2xl font-bold text-green-600">3</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Active Tokens</h3>
            <p className="text-sm text-gray-600 mt-1">Currently in queue</p>
          </Link>

          <Link
            to="/history"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <History className="h-8 w-8 text-yellow-600" />
              <span className="text-2xl font-bold text-gray-900">12</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Visit History</h3>
            <p className="text-sm text-gray-600 mt-1">Past appointments</p>
          </Link>

          <Link
            to="/notifications"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <Bell className="h-8 w-8 text-red-600" />
              <span className="text-2xl font-bold text-red-600">2</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <p className="text-sm text-gray-600 mt-1">Unread messages</p>
          </Link>
        </div>

        {/* Current Token Status */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Token Status</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Your Token</p>
                  <p className="text-3xl font-bold text-blue-900">A024</p>
                </div>
                <div className="text-center">
                  <QrCode className="h-16 w-16 text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-blue-600">Show QR at counter</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Position</p>
                  <p className="text-xl font-semibold text-gray-900">3rd</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Wait Time</p>
                  <p className="text-xl font-semibold text-gray-900">15 min</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-xl font-semibold text-green-600">Waiting</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Counter</p>
                  <p className="text-xl font-semibold text-gray-900">C-3</p>
                </div>
              </div>
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
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Token Booked</p>
                    <p className="text-sm text-gray-600">A024 - General Services</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">2 hours ago</p>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Token Called</p>
                    <p className="text-sm text-gray-600">A018 - Your turn approaching</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Yesterday</p>
                </div>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <History className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Visit Completed</p>
                    <p className="text-sm text-gray-600">A015 - Banking Services</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">2 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
