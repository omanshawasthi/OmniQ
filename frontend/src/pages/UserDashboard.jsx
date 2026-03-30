import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, History, QrCode, Bell, User } from 'lucide-react'

const UserDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Queueless</h1>
            </div>
            <nav className="flex space-x-8">
              <Link to="/user" className="text-primary-600 hover:text-primary-700">
                Dashboard
              </Link>
              <Link to="/user/book-token" className="text-gray-600 hover:text-gray-900">
                Book Token
              </Link>
              <Link to="/user/history" className="text-gray-600 hover:text-gray-900">
                History
              </Link>
              <Link to="/user/profile" className="text-gray-600 hover:text-gray-900">
                Profile
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h2>
          <p className="text-gray-600">Manage your tokens and track queue status</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            to="/user/book-token"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <Calendar className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">+</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Book Token</h3>
            <p className="text-sm text-gray-600 mt-1">Schedule your visit</p>
          </Link>
          
          <Link
            to="/user/history"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <History className="h-8 w-8 text-warning-600" />
              <span className="text-2xl font-bold text-gray-900">12</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Visit History</h3>
            <p className="text-sm text-gray-600 mt-1">Past appointments</p>
          </Link>
        </div>

        {/* Current Token Status */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Token Status</h3>
            
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-primary-600 font-medium">Your Token</p>
                  <p className="text-3xl font-bold text-primary-900">A024</p>
                </div>
                <div className="text-center">
                  <QrCode className="h-16 w-16 text-primary-600 mx-auto mb-2" />
                  <p className="text-xs text-primary-600">Show QR at counter</p>
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
                  <p className="text-xl font-semibold text-success-600">Waiting</p>
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
                  <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center mr-4">
                    <Calendar className="h-5 w-5 text-success-600" />
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
                  <div className="w-10 h-10 bg-warning-100 rounded-full flex items-center justify-center mr-4">
                    <Clock className="h-5 w-5 text-warning-600" />
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
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                    <History className="h-5 w-5 text-primary-600" />
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

export default UserDashboard
