import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, RefreshCw, AlertCircle, Search, X, LogOut,
  Filter, Calendar, Clock, User, Hash, MoreHorizontal
} from 'lucide-react'
import { staffAPI } from '../../utils/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_FLOW = {
  waiting:   { label: 'Waiting',   classes: 'bg-blue-100 text-blue-800' },
  serving:   { label: 'Serving',   classes: 'bg-green-100 text-green-800' },
  held:      { label: 'Held',      classes: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Completed', classes: 'bg-emerald-100 text-emerald-800' },
  skipped:   { label: 'Skipped',   classes: 'bg-orange-100 text-orange-700' },
  missed:    { label: 'Missed',    classes: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', classes: 'bg-gray-100 text-gray-400' },
  expired:   { label: 'Expired',   classes: 'bg-purple-100 text-purple-700' },
}

const formatTime = (d) =>
  d ? new Date(d).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'

const StatusBadge = ({ status }) => {
  const cfg = STATUS_FLOW[status?.toLowerCase()] || { label: status, classes: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wide ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}

const StaffHistoryPage = () => {
  const navigate = useNavigate()
  const { logout, user } = useAuthStore()

  const [tokens, setTokens]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState({
    search: '', 
    status: '', 
    source: '', 
    dateRange: '30days' // Default to 30 days for history
  })

  const loadHistory = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { ...filters }
      const data = await staffAPI.getTodayQueue(params) // Reusing the same endpoint with dateRange
      setTokens(data || [])
    } catch (err) {
      setError("Failed to load token history.")
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const h = setTimeout(loadHistory, filters.search ? 300 : 0)
    return () => clearTimeout(h)
  }, [loadHistory])

  const handleFilterChange = (key, val) =>
    setFilters(prev => ({ ...prev, [key]: val }))

  const clearFilters = () =>
    setFilters({ search: '', status: '', source: '', dateRange: '30days' })

  const handleLogout = async () => { await logout(); navigate('/login') }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link to="/staff" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Token History</h1>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={loadHistory} disabled={loading} className="p-2 text-gray-500 hover:text-blue-600">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 text-sm font-medium border-l pl-4 transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              placeholder="Search by token #, name, or phone..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
              value={filters.dateRange} 
              onChange={e => handleFilterChange('dateRange', e.target.value)} 
              className="flex-1 sm:flex-none px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold bg-white cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="all">Full History</option>
            </select>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 border rounded-xl text-sm font-semibold flex items-center gap-2 ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              <Filter className="w-4 h-4" /> Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-6 p-4 bg-white border border-gray-200 rounded-xl flex flex-wrap gap-4">
             <div className="flex-1 min-w-[150px]">
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Status</label>
               <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                 <option value="">All Statuses</option>
                 <option value="completed">Completed</option>
                 <option value="missed">Missed</option>
                 <option value="cancelled">Cancelled</option>
                 <option value="expired">Expired</option>
               </select>
             </div>
             <div className="flex-1 min-w-[150px]">
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Type</label>
               <select value={filters.source} onChange={e => handleFilterChange('source', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                 <option value="">All Types</option>
                 <option value="online">Online</option>
                 <option value="walk-in">Walk-in</option>
               </select>
             </div>
             <div className="flex items-end">
               <button onClick={clearFilters} className="text-sm text-red-600 font-medium px-4 py-2 hover:bg-red-50 rounded-lg">Clear All</button>
             </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500">Loading history records...</p>
          </div>
        ) : tokens.length === 0 ? (
          <div className="bg-white py-20 rounded-2xl border border-dashed border-gray-300 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-bold text-gray-900">No records found</p>
            <p className="text-gray-500 text-sm">Try adjusting your filters or date range.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Token</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Visitor</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Service</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Date & Time</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {tokens.map(token => (
                    <tr key={token._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                           <Hash className="w-3.5 h-3.5 text-gray-400" /> {token.tokenNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <User className="w-4 h-4 text-gray-400" />
                           <span className="text-sm text-gray-700 font-medium">
                             {token.userId?.name || token.metadata?.walkInName || 'Guest'}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{token.departmentId?.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {formatTime(token.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={token.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default StaffHistoryPage
