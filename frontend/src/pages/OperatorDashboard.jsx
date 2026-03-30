import React from 'react'
import { Link } from 'react-router-dom'
import { Users, Play, Pause, SkipForward, Check, Clock, AlertCircle } from 'lucide-react'

const OperatorDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Queueless - Operator</h1>
              <span className="ml-4 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                Counter C-3
              </span>
            </div>
            <nav className="flex space-x-8">
              <Link to="/dashboard" className="text-primary-600 hover:text-primary-700">
                Dashboard
              </Link>
              <Link to="/operator" className="text-gray-600 hover:text-gray-900">
                Overview
              </Link>
              <Link to="/operator/assigned-queue" className="text-gray-600 hover:text-gray-900">
                My Queue
              </Link>
              <Link to="/operator/serve-token" className="text-gray-600 hover:text-gray-900">
                Serve Token
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Operator Dashboard</h2>
          <p className="text-gray-600">Manage tokens at your assigned counter</p>
        </div>

        {/* Current Serving Token */}
        <div className="bg-success-50 border border-success-200 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-success-900">Currently Serving</h3>
            <span className="px-3 py-1 bg-success-600 text-white rounded-full text-sm">
              Active
            </span>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <p className="text-sm text-success-600 font-medium mb-1">Token Number</p>
                <p className="text-3xl font-bold text-success-900">A001</p>
              </div>
              
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-success-600">Customer Name</p>
                  <p className="font-medium text-success-900">John Doe</p>
                </div>
                <div>
                  <p className="text-sm text-success-600">Service Type</p>
                  <p className="font-medium text-success-900">General Services</p>
                </div>
                <div>
                  <p className="text-sm text-success-600">Start Time</p>
                  <p className="font-medium text-success-900">10:45 AM</p>
                </div>
              </div>
            </div>
            
            <div>
              <div className="mb-4">
                <p className="text-sm text-success-600 font-medium mb-1">Service Duration</p>
                <p className="text-3xl font-bold text-success-900">5:23</p>
              </div>
              
              <div className="space-y-3">
                <button className="w-full bg-success-600 text-white px-4 py-2 rounded-md hover:bg-success-700 transition-colors flex items-center justify-center gap-2">
                  <Check className="h-4 w-4" />
                  Complete Service
                </button>
                
                <div className="grid grid-cols-2 gap-2">
                  <button className="bg-warning-600 text-white px-4 py-2 rounded-md hover:bg-warning-700 transition-colors flex items-center justify-center gap-2">
                    <Pause className="h-4 w-4" />
                    Hold
                  </button>
                  
                  <button className="bg-error-600 text-white px-4 py-2 rounded-md hover:bg-error-700 transition-colors flex items-center justify-center gap-2">
                    <SkipForward className="h-4 w-4" />
                    Skip
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Queue Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <button className="bg-primary-600 text-white p-6 rounded-lg shadow-sm hover:bg-primary-700 transition-colors">
            <Users className="h-8 w-8 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Call Next</h3>
            <p className="text-sm opacity-90">Call the next token in queue</p>
          </button>

          <button className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <AlertCircle className="h-8 w-8 text-warning-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Recall Token</h3>
            <p className="text-sm text-gray-600">Recall a previously skipped token</p>
          </button>

          <button className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <Clock className="h-8 w-8 text-primary-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Break Time</h3>
            <p className="text-sm text-gray-600">Start a scheduled break</p>
          </button>
        </div>

        {/* Pending Queue */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Pending Queue</h3>
              <span className="text-sm text-gray-600">8 tokens waiting</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-lg font-bold text-primary-600">A002</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Jane Smith</p>
                    <p className="text-sm text-gray-600">Banking Services</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Wait time</p>
                  <p className="font-medium text-gray-900">12 min</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-lg font-bold text-primary-600">A003</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Bob Johnson</p>
                    <p className="text-sm text-gray-600">Document Services</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Wait time</p>
                  <p className="font-medium text-gray-900">18 min</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-lg font-bold text-primary-600">A004</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Sarah Wilson</p>
                    <p className="text-sm text-gray-600">General Services</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Wait time</p>
                  <p className="font-medium text-gray-900">25 min</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Statistics */}
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <Check className="h-6 w-6 text-success-600" />
              <span className="text-2xl font-bold text-gray-900">15</span>
            </div>
            <h4 className="font-medium text-gray-900">Completed</h4>
            <p className="text-sm text-gray-600">Today</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-6 w-6 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">8.5</span>
            </div>
            <h4 className="font-medium text-gray-900">Avg Service Time</h4>
            <p className="text-sm text-gray-600">Minutes</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <Pause className="h-6 w-6 text-warning-600" />
              <span className="text-2xl font-bold text-gray-900">3</span>
            </div>
            <h4 className="font-medium text-gray-900">Held</h4>
            <p className="text-sm text-gray-600">Today</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <SkipForward className="h-6 w-6 text-error-600" />
              <span className="text-2xl font-bold text-gray-900">2</span>
            </div>
            <h4 className="font-medium text-gray-900">Skipped</h4>
            <p className="text-sm text-gray-600">Today</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default OperatorDashboard
