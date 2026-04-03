import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useQueueActions } from '../../hooks/useQueue'
import { useQueueStatus } from '../../hooks/useQueue'
import { 
  Users, 
  Play, 
  Pause, 
  SkipForward, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react'
import { tokenAPI, queueAPI } from '../../utils/api'
import toast from 'react-hot-toast'

const QueueControl = () => {
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    status: 'waiting'
  })

  const { 
    callNext, 
    skip, 
    hold, 
    complete, 
    recall 
  } = useQueueActions()

  // Get queue status
  const { queueStatus, isLoading, refetch } = useQueueStatus(selectedBranch, selectedDepartment)

  // Get branches
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => apiClient.branches.getAll()
  })

  // Get departments when branch is selected
  const { data: departments } = useQuery({
    queryKey: ['departments', selectedBranch],
    queryFn: () => apiClient.departments.getAll(selectedBranch),
    enabled: !!selectedBranch
  })

  // Get counters
  const { data: counters } = useQuery({
    queryKey: ['counters', selectedBranch, selectedDepartment],
    queryFn: () => apiClient.counters.getAll(selectedBranch, selectedDepartment),
    enabled: !!selectedBranch
  })

  const handleCallNext = async (counterId) => {
    try {
      await callNext(counterId)
      toast.success('Next token called!')
    } catch (error) {
      // Error is handled in the hook
    }
  }

  const handleSkip = async (tokenId, reason = '') => {
    try {
      await skip(tokenId, reason)
      toast.success('Token skipped!')
    } catch (error) {
      // Error is handled in the hook
    }
  }

  const handleHold = async (tokenId, reason = '') => {
    try {
      await hold(tokenId, reason)
      toast.success('Token held!')
    } catch (error) {
      // Error is handled in the hook
    }
  }

  const handleComplete = async (tokenId) => {
    try {
      await complete(tokenId, 0) // Service time will be calculated automatically
      toast.success('Token completed!')
    } catch (error) {
      // Error is handled in the hook
    }
  }

  const handleRecall = async (tokenId) => {
    try {
      await recall(tokenId)
      toast.success('Token recalled!')
    } catch (error) {
      // Error is handled in the hook
    }
  }

  const filteredTokens = queueStatus?.waiting?.filter(token => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        token.tokenNumber.toLowerCase().includes(query) ||
        (token.userId?.name && token.userId.name.toLowerCase().includes(query)) ||
        (token.metadata?.walkInName && token.metadata.walkInName.toLowerCase().includes(query))
      )
    }
    return true
  }) || []

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'serving':
        return <Play className="h-4 w-4 text-blue-500" />
      case 'held':
        return <Pause className="h-4 w-4 text-orange-500" />
      case 'skipped':
        return <SkipForward className="h-4 w-4 text-gray-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800'
      case 'serving':
        return 'bg-blue-100 text-blue-800'
      case 'held':
        return 'bg-orange-100 text-orange-800'
      case 'skipped':
        return 'bg-gray-100 text-gray-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Queue Control</h1>
            <p className="text-gray-600">Manage and control the queue flow</p>
          </div>
          <button
            onClick={() => refetch()}
            className="btn-outline btn-md flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid md:grid-cols-4 gap-4">
          {/* Branch Filter */}
          <div>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Branches</option>
              {branches?.data?.branches?.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              disabled={!selectedBranch}
            >
              <option value="">All Departments</option>
              {departments?.data?.departments?.map((department) => (
                <option key={department._id} value={department._id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="waiting">Waiting</option>
              <option value="serving">Serving</option>
              <option value="held">Held</option>
              <option value="skipped">Skipped</option>
              <option value="all">All Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Queue Statistics */}
      <div className="grid md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-8 w-8 text-yellow-500" />
            <span className="text-2xl font-bold text-gray-900">
              {queueStatus?.statistics?.totalWaiting || 0}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Waiting</h3>
          <p className="text-sm text-gray-600">Currently in queue</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <Play className="h-8 w-8 text-blue-500" />
            <span className="text-2xl font-bold text-gray-900">
              {queueStatus?.statistics?.totalServing || 0}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Serving</h3>
          <p className="text-sm text-gray-600">Being served now</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <Pause className="h-8 w-8 text-orange-500" />
            <span className="text-2xl font-bold text-gray-900">
              {queueStatus?.statistics?.totalHeld || 0}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Held</h3>
          <p className="text-sm text-gray-600">Temporarily paused</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-8 w-8 text-gray-500" />
            <span className="text-2xl font-bold text-gray-900">
              {Math.round(queueStatus?.statistics?.averageWaitTime || 0)}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Avg Wait</h3>
          <p className="text-sm text-gray-600">Minutes</p>
        </div>
      </div>

      {/* Counter Controls */}
      {counters?.data?.counters?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Counter Controls</h2>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {counters.data.counters.map((counter) => (
                <div key={counter._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{counter.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      counter.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : counter.status === 'paused'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {counter.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {counter.currentToken ? (
                      <div className="text-sm">
                        <span className="text-gray-600">Current: </span>
                        <span className="font-medium">{counter.currentToken.tokenNumber}</span>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No active token</div>
                    )}
                    
                    <button
                      onClick={() => handleCallNext(counter._id)}
                      disabled={counter.status !== 'active'}
                      className="w-full btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Call Next
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Queue Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Queue ({filteredTokens.length} tokens)
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Token
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
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
              {filteredTokens.map((token) => (
                <tr key={token._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">
                        {token.tokenNumber}
                      </span>
                      {token.priority === 'high' && (
                        <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                          High
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {token.bookingType === 'online' ? 'Online' : 'Walk-in'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {token.userId?.name || token.metadata?.walkInName || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {token.userId?.email || token.metadata?.walkInEmail || ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {token.departmentId?.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(token.status)}`}>
                      {getStatusIcon(token.status)}
                      <span className="ml-1">
                        {token.status.charAt(0).toUpperCase() + token.status.slice(1)}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {token.estimatedWaitTime ? 
                        `${Math.round(token.estimatedWaitTime)} min` : 
                        'Calculating...'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      {token.status === 'waiting' && (
                        <>
                          <button
                            onClick={() => handleSkip(token._id)}
                            className="text-yellow-600 hover:text-yellow-800 text-sm"
                            title="Skip"
                          >
                            <SkipForward className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleHold(token._id)}
                            className="text-orange-600 hover:text-orange-800 text-sm"
                            title="Hold"
                          >
                            <Pause className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      
                      {token.status === 'skipped' && (
                        <button
                          onClick={() => handleRecall(token._id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          title="Recall"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      )}
                      
                      {token.status === 'serving' && (
                        <button
                          onClick={() => handleComplete(token._id)}
                          className="text-green-600 hover:text-green-800 text-sm"
                          title="Complete"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      
                      {token.status === 'held' && (
                        <button
                          onClick={() => handleRecall(token._id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          title="Resume"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default QueueControl
