import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { tokenAPI } from '../../utils/api'

const HistoryPage = () => {
  const [tokens, setTokens] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingTokenId, setCancellingTokenId] = useState(null)
  const [activeTab, setActiveTab] = useState('ALL')

  const TABS = [
    { id: 'ALL', label: 'All', icon: null },
    { id: 'WAITING,SERVING,HELD', label: 'Active', icon: <Clock className="h-4 w-4" /> },
    { id: 'COMPLETED', label: 'Completed', icon: <CheckCircle className="h-4 w-4" /> },
    { id: 'CANCELLED', label: 'Cancelled', icon: <XCircle className="h-4 w-4" /> },
    { id: 'MISSED,SKIPPED', label: 'Missed', icon: <AlertCircle className="h-4 w-4" /> },
  ]

  useEffect(() => {
    loadTokens()
  }, [activeTab])

  const loadTokens = async () => {
    setIsLoading(true)
    try {
      const params = {
        limit: 50,
        sort: '-createdAt'
      }
      if (activeTab !== 'ALL') {
        params.status = activeTab
      }

      const res = await tokenAPI.getMyTokens(params)
      setTokens(res.tokens || [])
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading tokens:', error)
      setError('Failed to load token history')
      setIsLoading(false)
    }
  }

  const handleCancelToken = async (tokenId) => {
    if (!window.confirm('Are you sure you want to cancel this token?')) return
    
    setCancellingTokenId(tokenId)
    try {
      await tokenAPI.cancelToken(tokenId)
      
      // Update local state
      setTokens(prev => prev.map(token => 
        token._id === tokenId 
          ? { ...token, status: 'CANCELLED' }
          : token
      ))
    } catch (error) {
      console.error('Error cancelling token:', error)
      setError(error.response?.data?.message || 'Failed to cancel token')
    } finally {
      setCancellingTokenId(null)
    }
  }

  const normalizeStatus = (s) => (s || '').toLowerCase()

  const getStatusIcon = (status) => {
    const s = normalizeStatus(status)
    switch (s) {
      case 'waiting':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'serving':
        return <RefreshCw className="h-4 w-4 text-green-500 animate-spin-slow" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'held':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status) => {
    const s = normalizeStatus(status)
    const styles = {
      waiting: 'bg-blue-100 text-blue-800',
      serving: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-800',
      held: 'bg-yellow-100 text-yellow-800',
      missed: 'bg-gray-100 text-gray-600',
      skipped: 'bg-gray-100 text-gray-600',
    }
    
    return (
      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${styles[s] || 'bg-gray-100 text-gray-800'}`}>
        {status || 'Unknown'}
      </span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const canCancelToken = (token) => {
    const s = normalizeStatus(token.status)
    return s === 'waiting' || s === 'held'
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link id="back-to-dash" to="/user" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">My Tokens</h1>
            </div>
            <button 
              onClick={loadTokens}
              disabled={isLoading}
              className="p-2 text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50"
              title="Refresh tokens"
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Filters/Tabs */}
      <div className="bg-white border-b mb-6 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && !isLoading && (
                  <span className="ml-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                    {tokens.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Tokens List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-gray-500 animate-pulse">Loading your tokens...</p>
          </div>
        ) : tokens.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-20 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tokens found</h3>
            <p className="text-gray-500 mb-6 px-4">
              {activeTab === 'ALL' 
                ? "You haven't booked any tokens yet." 
                : `No tokens match the "${TABS.find(t => t.id === activeTab)?.label}" filter.`}
            </p>
            <Link
              to="/user/book-token"
              className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm"
            >
              Book New Token
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tokens.map((token) => (
              <div key={token._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                <div className="p-5 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        {token.departmentId?.name || 'Service'}
                      </h3>
                      <p className="text-lg font-bold text-gray-900 leading-tight">
                        {token.branchId?.name || 'Branch'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-blue-600 mb-1 leading-none">{token.tokenNumber}</p>
                      {getStatusBadge(token.status)}
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Booked: {formatDate(token.createdAt)}</span>
                    </div>
                    
                    {normalizeStatus(token.status) === 'waiting' && (
                      <>
                        <div className="flex items-center text-sm font-medium text-blue-700 bg-blue-50 p-2 rounded-lg">
                          <Activity className="h-4 w-4 mr-2" />
                          <span>Queue Position: {token.queuePosition || 'Calculating...'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2 text-gray-400" />
                          <span>Wait Time: ~{token.estimatedWaitTime || '0'} mins</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 border-t border-gray-100 flex gap-3">
                  <Link
                    id={`view-details-${token._id}`}
                    to={`/token/${token._id}`}
                    className="flex-1 text-center py-2 px-4 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Details
                  </Link>
                  {normalizeStatus(token.status) === 'waiting' && (
                    <Link
                      to={`/token/${token._id}/live`}
                      className="flex-1 text-center py-2 px-4 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors"
                    >
                      Live Track
                    </Link>
                  )}
                  {canCancelToken(token) && (
                    <button
                      onClick={() => handleCancelToken(token._id)}
                      disabled={cancellingTokenId === token._id}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                      title="Cancel Token"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default HistoryPage
