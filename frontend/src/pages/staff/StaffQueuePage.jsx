import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, RefreshCw, AlertCircle, Search, X, LogOut,
  UserPlus, Filter, ChevronRight, Play, CheckSquare, SkipForward,
  PauseCircle, RotateCcw, UserX, UserCheck
} from 'lucide-react'
import { staffAPI } from '../../utils/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_FLOW = {
  waiting:   { label: 'Waiting',   classes: 'bg-blue-100 text-blue-800' },
  serving:   { label: 'Serving',   classes: 'bg-green-100 text-green-800' },
  held:      { label: 'Held',      classes: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Completed', classes: 'bg-gray-100 text-gray-600' },
  skipped:   { label: 'Skipped',   classes: 'bg-orange-100 text-orange-700' },
  missed:    { label: 'Missed',    classes: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', classes: 'bg-gray-100 text-gray-400' },
}

const PRIORITY_STYLES = {
  urgent: 'bg-red-500 text-white',
  high:   'bg-orange-500 text-white',
}

// ─── Per-status allowed actions ───────────────────────────────────────────────
// This mirrors the backend transition map — only shows valid operations per state
const ALLOWED_ACTIONS = {
  waiting:  ['serve', 'checkin', 'hold', 'skip', 'missed'],
  serving:  ['complete', 'hold', 'skip'],
  held:     ['serve', 'skip', 'missed'],
  skipped:  ['recall', 'missed'],
  missed:   ['recall'],
  completed: [],
  cancelled:  [],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getDisplayName = (token) =>
  token.userId?.name || token.metadata?.walkInName || 'Walk-in Guest'

const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'

const StatusBadge = ({ status }) => {
  const cfg = STATUS_FLOW[status?.toLowerCase()] || { label: status, classes: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md uppercase tracking-wide ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}

const SourceBadge = ({ type }) => {
  const isWalkIn = type === 'walk-in'
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${isWalkIn ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'}`}>
      {isWalkIn ? 'Walk-in' : 'Online'}
    </span>
  )
}

// ─── Action Button Config ─────────────────────────────────────────────────────
const ACTION_CONFIG = {
  serve:    { label: 'Serve',     icon: Play,         classes: 'bg-green-600 hover:bg-green-700 text-white' },
  complete: { label: 'Complete',  icon: CheckSquare,  classes: 'bg-blue-600 hover:bg-blue-700 text-white' },
  skip:     { label: 'Skip',      icon: SkipForward,  classes: 'bg-orange-500 hover:bg-orange-600 text-white' },
  hold:     { label: 'Hold',      icon: PauseCircle,  classes: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
  recall:   { label: 'Recall',    icon: RotateCcw,    classes: 'bg-indigo-500 hover:bg-indigo-600 text-white' },
  missed:   { label: 'Missed',    icon: UserX,        classes: 'bg-red-500 hover:bg-red-600 text-white' },
  checkin:  { label: 'Check-in',  icon: UserCheck,    classes: 'bg-teal-500 hover:bg-teal-600 text-white' },
}

// ─── Token Row ────────────────────────────────────────────────────────────────
const TokenRow = ({ token, onAction, loadingAction }) => {
  const status = (token.status || '').toLowerCase()
  const allowedActions = ALLOWED_ACTIONS[status] || []
  const isCheckedIn = !!token.checkedInAt
  const filteredActions = allowedActions.filter(a => !(a === 'checkin' && isCheckedIn))

  return (
    <tr className="hover:bg-gray-50 transition-colors align-top">
      {/* Token # & visitor */}
      <td className="px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-gray-900">{token.tokenNumber}</span>
            {token.priority && PRIORITY_STYLES[token.priority] && (
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${PRIORITY_STYLES[token.priority]}`}>
                {token.priority}
              </span>
            )}
            {isCheckedIn && (
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-teal-100 text-teal-700">✓ In</span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-0.5">{getDisplayName(token)}</p>
          {token.metadata?.walkInPhone && (
            <p className="text-xs text-gray-400">{token.metadata.walkInPhone}</p>
          )}
        </div>
      </td>

      {/* Service */}
      <td className="px-5 py-4">
        <p className="text-sm font-semibold text-gray-800">{token.departmentId?.name || '—'}</p>
        <p className="text-xs text-gray-500">{token.branchId?.name || '—'}</p>
      </td>

      {/* Badges */}
      <td className="px-5 py-4">
        <div className="flex flex-col gap-1.5 items-start">
          <SourceBadge type={token.bookingType} />
          <StatusBadge status={token.status} />
        </div>
      </td>

      {/* Time */}
      <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
        {formatTime(token.scheduledTime || token.createdAt)}
      </td>

      {/* Actions */}
      <td className="px-5 py-4">
        <div className="flex flex-wrap gap-1.5">
          {filteredActions.length === 0 ? (
            <span className="text-xs text-gray-400 italic">No actions</span>
          ) : (
            filteredActions.map(actionKey => {
              const cfg = ACTION_CONFIG[actionKey]
              if (!cfg) return null
              const Icon = cfg.icon
              const isLoading = loadingAction?.tokenId === token._id && loadingAction?.action === actionKey
              return (
                <button
                  key={actionKey}
                  onClick={() => onAction(token._id, actionKey, token)}
                  disabled={!!loadingAction}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${cfg.classes}`}
                >
                  {isLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                  {cfg.label}
                </button>
              )
            })
          )}
        </div>
      </td>
    </tr>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const StaffQueuePage = () => {
  const navigate = useNavigate()
  const { logout, user } = useAuthStore()

  const [tokens, setTokens]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [loadingAction, setLoadingAction] = useState(null) // { tokenId, action }
  const [callingNext, setCallingNext]  = useState(false)

  const [filters, setFilters] = useState({
    search: '', status: '', source: '', priority: ''
  })

  const loadQueue = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (filters.search)   params.search   = filters.search
      if (filters.status)   params.status   = filters.status
      if (filters.source)   params.source   = filters.source
      if (filters.priority) params.priority = filters.priority
      const data = await staffAPI.getTodayQueue(params)
      setTokens(data || [])
    } catch {
      setError("Failed to load today's queue.")
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const h = setTimeout(loadQueue, filters.search ? 300 : 0)
    return () => clearTimeout(h)
  }, [loadQueue])

  const handleFilterChange = (key, val) =>
    setFilters(prev => ({ ...prev, [key]: val }))

  const clearFilters = () =>
    setFilters({ search: '', status: '', source: '', priority: '' })

  const hasActiveFilters = filters.status || filters.source || filters.priority

  // ── Queue Actions ───────────────────────────────────────────────────────────
  const handleAction = async (tokenId, action, token) => {
    if (loadingAction) return // prevent parallel actions
    setLoadingAction({ tokenId, action })
    try {
      switch (action) {
        case 'serve':    await staffAPI.serveToken(tokenId);    break
        case 'complete': await staffAPI.completeToken(tokenId); break
        case 'skip':     await staffAPI.skipToken(tokenId);     break
        case 'hold':     await staffAPI.holdToken(tokenId);     break
        case 'recall':   await staffAPI.recallToken(tokenId);   break
        case 'missed':   await staffAPI.markMissed(tokenId);    break
        case 'checkin':  await staffAPI.checkIn(tokenId);       break
        default: break
      }
      const actionLabels = {
        serve: 'Now serving', complete: 'Completed', skip: 'Skipped',
        hold: 'On hold', recall: 'Recalled to queue', missed: 'Marked as missed',
        checkin: 'Checked in'
      }
      toast.success(`${actionLabels[action] || action}: ${token.tokenNumber}`)
      await loadQueue()
    } catch (err) {
      const msg = err?.response?.data?.message || `Failed to perform action: ${action}`
      toast.error(msg)
    } finally {
      setLoadingAction(null)
    }
  }

  const handleCallNext = async () => {
    if (callingNext) return
    setCallingNext(true)
    try {
      const branchId = user?.branchId
      const token = await staffAPI.callNext({ branchId })
      toast.success(`Calling ${token.tokenNumber}!`)
      await loadQueue()
    } catch (err) {
      const msg = err?.response?.data?.message || 'No tokens in queue'
      toast.error(msg)
    } finally {
      setCallingNext(false)
    }
  }

  const handleLogout = async () => { await logout(); navigate('/login') }

  // ── Render ──────────────────────────────────────────────────────────────────
  const STATUS_OPTIONS = ['waiting', 'serving', 'held', 'completed', 'skipped', 'missed', 'cancelled']

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link to="/staff" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Today's Queue</h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Call Next — primary CTA */}
              <button
                onClick={handleCallNext}
                disabled={callingNext || !!loadingAction}
                className="hidden sm:inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
              >
                {callingNext ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                Call Next
              </button>
              <Link to="/staff/walk-in" className="hidden sm:inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
                <UserPlus className="w-4 h-4" /> Walk-in
              </Link>
              <button onClick={loadQueue} disabled={loading} className="p-2 text-gray-500 hover:text-blue-600 disabled:opacity-50">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={handleLogout} className="flex items-center gap-2 text-gray-500 hover:text-red-600 text-sm font-medium border-l pl-4 transition-colors">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Mobile CTAs */}
        <div className="flex gap-3 mb-4 sm:hidden">
          <button
            onClick={handleCallNext}
            disabled={callingNext || !!loadingAction}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-lg"
          >
            {callingNext ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
            Call Next
          </button>
          <Link to="/staff/walk-in" className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-bold py-2.5 rounded-lg">
            <UserPlus className="w-4 h-4" /> Walk-in
          </Link>
        </div>

        {/* Search + Filter */}
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              placeholder="Search token #, name, or phone..."
              className="w-full pl-10 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            {filters.search && (
              <button onClick={() => handleFilterChange('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-semibold transition-colors ${hasActiveFilters ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'}`}
          >
            <Filter className="w-4 h-4" /> Filters
            {hasActiveFilters && <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">!</span>}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-4 bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Status</label>
              <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Source</label>
              <select value={filters.source} onChange={e => handleFilterChange('source', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Sources</option>
                <option value="online">Online</option>
                <option value="walk-in">Walk-in</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Priority</label>
              <select value={filters.priority} onChange={e => handleFilterChange('priority', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Priorities</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-red-600 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50">
                <X className="w-4 h-4" /> Clear
              </button>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Count */}
        {!loading && !error && (
          <p className="mb-3 text-sm text-gray-500">
            <span className="font-semibold text-gray-700">{tokens.length}</span> token{tokens.length !== 1 ? 's' : ''}{' '}
            {hasActiveFilters || filters.search ? 'matching filters' : 'today'}
          </p>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500 font-medium">Loading queue...</p>
          </div>
        ) : tokens.length === 0 ? (
          <div className="bg-white py-20 rounded-xl border border-dashed border-gray-300 text-center">
            <p className="text-lg font-semibold text-gray-900 mb-2">Queue is Empty</p>
            <p className="text-gray-500 text-sm mb-6">
              {hasActiveFilters || filters.search ? 'Try adjusting your filters.' : 'No tokens for today yet.'}
            </p>
            <Link to="/staff/walk-in" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-lg">
              <UserPlus className="w-4 h-4" /> Add Walk-in Token
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Token & Visitor</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Source / Status</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {tokens.map(token => (
                    <TokenRow
                      key={token._id}
                      token={token}
                      onAction={handleAction}
                      loadingAction={loadingAction}
                    />
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

export default StaffQueuePage
