import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Users } from 'lucide-react'

const WalkInPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/staff" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Staff
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Walk-in Management</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Walk-in Tokens</h2>
          <p className="text-gray-600">Create and manage walk-in queue tokens</p>
        </div>

        {/* Walk-in Interface Placeholder */}
        <div className="bg-white shadow-sm rounded-lg border p-8">
          <div className="text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Walk-in Token Creation</h3>
            <p className="text-gray-600">Walk-in token interface will be implemented here.</p>
            <p className="text-sm text-gray-500 mt-2">Features: Quick Token Creation, Customer Details, Priority Settings</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default WalkInPage
