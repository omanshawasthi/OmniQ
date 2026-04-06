import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Users, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Play, Pause, SkipForward, CheckSquare } from 'lucide-react'
import { tokenAPI, queueAPI } from '../../utils/api'

const QueueManagementPage = () => {
  const [queueData, setQueueData] = useState(null)
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [branches, setBranches] = useState([])
  const [departments, setDepartments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedBranch && selectedDepartment) {
      loadQueueData()
    }
  }, [selectedBranch, selectedDepartment])

  const loadInitialData = async () => {
    try {
      const branchesResponse = await tokenAPI.getBranches()
      setBranches(branchesResponse.data.data)
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading initial data:', error)
      setError('Failed to load data')
      setIsLoading(false)
    }
  }

  const loadQueueData = async () => {
    try {
      const response = await queueAPI.getQueueStatus(selectedBranch, selectedDepartment)
      setQueueData(response.data.data.queueStatus)
    } catch (error) {
      console.error('Error loading queue data:', error)
      setError('Failed to load queue data')
    }
  }

  const handleTokenAction = async (tokenId, action, reason = '') => {
    setActionLoading(true)
    try {
      let response
      switch (action) {
        case 'call':
          // Need counter ID for calling next token
          response = await queueAPI.callNextToken('counter_id_placeholder')
          break
        case 'serve':
          response = await queueAPI.callNextToken(tokenId)
          break
        case 'complete':
          response = await queueAPI.completeToken(tokenId)
          break
        case 'skip':
          response = await queueAPI.skipToken(tokenId, reason)
          break
        case 'hold':
          response = await queueAPI.holdToken(tokenId, reason)
          break
        case 'recall':
          response = await queueAPI.recallToken(tokenId)
          break
        case 'checkin':
          response = await queueAPI.checkInToken(tokenId)
          break
        default:
          throw new Error('Unknown action')
      }
      
      // Reload queue data after action
      await loadQueueData()
    } catch (error) {
      console.error('Error performing token action:', error)
      setError(error.response?.data?.message || `Failed to ${action} token`)
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'serving':
        return <Play className="h-4 w-4 text-orange-500" />
      case 'held':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'skipped':
        return <SkipForward className="h-4 w-4 text-purple-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      waiting: 'bg-blue-100 text-blue-800',
      serving: 'bg-orange-100 text-orange-800',
      held: 'bg-yellow-100 text-yellow-800',
      skipped: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getActionButtons = (token) => {
    const buttons = []
    
    if (token.status === 'waiting') {
      buttons.push(
        <button
          key="checkin"
          onClick={() => handleTokenAction(token._id, 'checkin')}
          disabled={actionLoading}
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Check In
        </button>
      )
    }
    
    if (token.status === 'waiting' || token.status === 'skipped') {
      buttons.push(
        <button
          key="serve"
          onClick={() => handleTokenAction(token._id, 'serve')}
          disabled={actionLoading}
          className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
        >
          Call Next
        </button>
      )
    }
    
    if (token.status === 'serving') {
      buttons.push(
        <button
          key="complete"
          onClick={() => handleTokenAction(token._id, 'complete')}
          disabled={actionLoading}
          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Complete
        </button>
      )
      buttons.push(
        <button
          key="hold"
          onClick={() => handleTokenAction(token._id, 'hold')}
          disabled={actionLoading}
          className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
        >
          Hold
        </button>
      )
    }
    
    if (token.status === 'serving' || token.status === 'waiting') {
      buttons.push(
        <button
          key="skip"
          onClick={() => handleTokenAction(token._id, 'skip')}
          disabled={actionLoading}
          className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          Skip
        </button>
      )
    }
    
    if (token.status === 'skipped') {
      buttons.push(
        <button
          key="recall"
          onClick={() => handleTokenAction(token._id, 'recall')}
          disabled={actionLoading}
          className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          Recall
        </button>
      )
    }
    
    return buttons
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-r-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/admin" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Queue Management</h1>
            </div>
            <button
              onClick={loadQueueData}
              disabled={!selectedBranch || !selectedDepartment}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white shadow-sm rounded-lg border p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => {
                  setSelectedBranch(e.target.value)
                  setSelectedDepartment('')
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select branch</option>
                {branches.map(branch => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                disabled={!selectedBranch}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
              >
                <option value="">Select department</option>
                {/* Departments would be loaded based on selected branch */}
              </select>
            </div>
          </div>
        </div>

        {queueData ? (
          <div className="space-y-6">
            {/* Statistics */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white shadow-sm rounded-lg border p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Total Waiting</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {queueData.statistics?.totalWaiting || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white shadow-sm rounded-lg border p-4">
                <div className="flex items-center">
                  <Play className="h-8 w-8 text-orange-500" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Now Serving</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {queueData.statistics?.totalServing || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white shadow-sm rounded-lg border p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {queueData.statistics?.totalCompleted || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white shadow-sm rounded-lg border p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-yellow-500" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">On Hold</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {queueData.statistics?.totalHeld || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Serving */}
            {queueData.serving && queueData.serving.length > 0 && (
              <div className="bg-white shadow-sm rounded-lg border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Currently Serving</h3>
                <div className="space-y-3">
                  {queueData.serving.map(token => (
                    <div key={token._id} className="flex items-center justify-between bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center">
                        {getStatusIcon(token.status)}
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{token.tokenNumber}</p>
                          <p className="text-sm text-gray-600">{token.userId?.name || 'Walk-in'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(token.status)}
                        {getActionButtons(token)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Waiting Queue */}
            {queueData.waiting && queueData.waiting.length > 0 && (
              <div className="bg-white shadow-sm rounded-lg border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Waiting Queue</h3>
                <div className="space-y-3">
                  {queueData.waiting.map((token, index) => (
                    <div key={token._id} className="flex items-center justify-between border rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">
                          {index + 1}
                        </div>
                        {getStatusIcon(token.status)}
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{token.tokenNumber}</p>
                          <p className="text-sm text-gray-600">{token.userId?.name || 'Walk-in'}</p>
                          <p className="text-xs text-gray-500">Wait: ~{token.estimatedWaitTime} min</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(token.status)}
                        {getActionButtons(token)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Held Tokens */}
            {queueData.held && queueData.held.length > 0 && (
              <div className="bg-white shadow-sm rounded-lg border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">On Hold</h3>
                <div className="space-y-3">
                  {queueData.held.map(token => (
                    <div key={token._id} className="flex items-center justify-between bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-center">
                        {getStatusIcon(token.status)}
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{token.tokenNumber}</p>
                          <p className="text-sm text-gray-600">{token.userId?.name || 'Walk-in'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(token.status)}
                        {getActionButtons(token)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {(!queueData.waiting || queueData.waiting.length === 0) && 
             (!queueData.serving || queueData.serving.length === 0) && 
             (!queueData.held || queueData.held.length === 0) && (
              <div className="bg-white shadow-sm rounded-lg border p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Tokens</h3>
                <p className="text-gray-600">No tokens are currently in the queue.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg border p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select Branch and Department</h3>
            <p className="text-gray-600">Please select a branch and department to view the queue.</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default QueueManagementPage
