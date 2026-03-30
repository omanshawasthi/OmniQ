import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Calendar, Clock, CheckCircle, XCircle,
  Ticket, Activity, LogOut, User,
  AlertCircle, RefreshCw, ChevronRight, Loader2
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { dashboardAPI, tokenAPI } from '../utils/api'
import toast from 'react-hot-toast'
import RescheduleModal from '../components/user/RescheduleModal'

// ─── Token status normalizer (backend uses lowercase) ─────────────────────────
const ACTIVE_STATUSES = ['waiting', 'serving', 'held']

const normalizeStatus = (status) =>
  typeof status === 'string' ? status.toLowerCase() : ''

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_MAP = {
  waiting:   { label: 'Waiting',   cls: 'bg-yellow-100 text-yellow-800' },
  serving:   { label: 'Now Serving', cls: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', cls: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-800' },
  missed:    { label: 'Missed',    cls: 'bg-gray-100 text-gray-600' },
  held:      { label: 'On Hold',   cls: 'bg-orange-100 text-orange-800' },
  skipped:   { label: 'Skipped',   cls: 'bg-gray-100 text-gray-500' },
}

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[normalizeStatus(status)] || { label: status || '—', cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  )
}

// ─── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
)

// ─── Format relative date ───────────────────────────────────────────────────────
const formatRelativeDate = (date) => {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  const now = new Date()
  const diffMs = now - d
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return d.toLocaleDateString()
}

// ─── Helper: extract branch/dept name from populated or flat field ────────────
const getBranchName = (token) =>
  token?.branchId?.name || token?.branch?.name || token?.branchName || '—'

const getDeptName = (token) =>
  token?.departmentId?.name || token?.department?.name || token?.departmentName || '—'

// ─── Main component ────────────────────────────────────────────────────────────
const UserDashboard = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const [allTokens, setAllTokens] = useState(null)
  const [activeToken, setActiveToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch up to 100 tokens for stats + history
      // Response shape: { tokens, totalPages, currentPage, total }
      const res = await dashboardAPI.getMyTokens({ limit: 100 })

      let tokens = []
      if (Array.isArray(res)) {
        tokens = res
      } else if (Array.isArray(res?.tokens)) {
        tokens = res.tokens
      } else if (Array.isArray(res?.data)) {
        tokens = res.data
      }

      setAllTokens(tokens)

      // Find first active token (waiting / serving / held)
      const active = tokens.find((t) =>
        ACTIVE_STATUSES.includes(normalizeStatus(t.status))
      )
      setActiveToken(active ?? null)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      if (err?.response?.status === 401) {
        // Expired session — force logout
        logout()
        navigate('/login')
        return
      }
      setError(
        err?.response?.data?.message ||
        'Failed to load dashboard data. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }, [logout, navigate])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  // Compute summary stats
  const stats = allTokens
    ? {
        active:    allTokens.filter((t) => ACTIVE_STATUSES.includes(normalizeStatus(t.status))).length,
        completed: allTokens.filter((t) => normalizeStatus(t.status) === 'completed').length,
        cancelled: allTokens.filter((t) => ['cancelled', 'missed'].includes(normalizeStatus(t.status))).length,
        lastActivity: allTokens[0]?.createdAt ?? null,
      }
    : null

  // Last 5 for recent history
  const recentTokens = allTokens ? allTokens.slice(0, 5) : []

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleCancelToken = async () => {
    if (!activeToken) return
    if (!window.confirm('Are you sure you want to cancel this token? This action cannot be undone.')) return

    setIsCancelling(true)
    try {
      await tokenAPI.cancelToken(activeToken._id)
      toast.success('Token cancelled successfully')
      fetchDashboard()
    } catch (err) {
      console.error('Cancel error:', err)
      toast.error(err.response?.data?.message || 'Failed to cancel token')
    } finally {
      setIsCancelling(false)
    }
  }

  const canCancel = (token) => {
    if (!token) return false
    const s = normalizeStatus(token.status)
    // Business rule check usually handled by backend, but we can disable UI if obvious
    return s === 'waiting' || s === 'held'
  }

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Ticket className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">Queueless</span>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <Link to="/dashboard"          className="text-blue-600 font-medium text-sm">Dashboard</Link>
              <Link to="/user/book-token"    className="text-gray-500 hover:text-gray-900 text-sm">Book Token</Link>
              <Link to="/user/history"       className="text-gray-500 hover:text-gray-900 text-sm">History</Link>
              <Link to="/user/profile"       className="text-gray-500 hover:text-gray-900 text-sm">Profile</Link>
            </nav>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">{user?.name || 'User'}</span>
              </div>
              <button
                id="logout-btn"
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-md hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Welcome ─────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Here's what's happening with your tokens today.
          </p>
        </div>

        {/* ── Error Banner ─────────────────────────────────────────────────── */}
        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">Failed to load dashboard</p>
              <p className="text-sm mt-0.5 text-red-600">{error}</p>
            </div>
            <button
              id="retry-btn"
              onClick={fetchDashboard}
              className="flex items-center gap-1 text-sm font-medium text-red-700 hover:text-red-800"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        )}

        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Activity}
            label="Active Tokens"
            value={stats?.active ?? 0}
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            icon={CheckCircle}
            label="Completed"
            value={stats?.completed ?? 0}
            color="bg-green-50 text-green-600"
          />
          <StatCard
            icon={XCircle}
            label="Cancelled / Missed"
            value={stats?.cancelled ?? 0}
            color="bg-red-50 text-red-500"
          />
          <StatCard
            icon={Clock}
            label="Last Activity"
            value={formatRelativeDate(stats?.lastActivity)}
            color="bg-purple-50 text-purple-600"
          />
        </div>

        {/* ── Active Token ──────────────────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Active Token</h2>

          {activeToken ? (
            <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">
                    {getDeptName(activeToken) !== '—'
                      ? getDeptName(activeToken)
                      : getBranchName(activeToken)}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">{activeToken.tokenNumber}</p>
                </div>
                <StatusBadge status={activeToken.status} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Branch</p>
                  <p className="text-sm font-medium text-gray-900">{getBranchName(activeToken)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Department</p>
                  <p className="text-sm font-medium text-gray-900">{getDeptName(activeToken)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Est. Wait</p>
                  <p className="text-sm font-medium text-gray-900">
                    {activeToken.estimatedWaitTime != null
                      ? `${activeToken.estimatedWaitTime} min`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Booked At</p>
                  <p className="text-sm font-medium text-gray-900">
                    {activeToken.createdAt
                      ? new Date(activeToken.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <Link
                  id="view-token-btn"
                  to={`/token/${activeToken._id}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
                >
                  View Details
                  <ChevronRight className="h-4 w-4" />
                </Link>
                {normalizeStatus(activeToken.status) === 'waiting' && (
                  <button
                    onClick={() => setIsRescheduling(true)}
                    className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reschedule
                  </button>
                )}
                {canCancel(activeToken) && (
                  <button
                    onClick={handleCancelToken}
                    disabled={isCancelling}
                    className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium py-2.5 px-4 rounded-lg transition-colors border border-red-100 disabled:opacity-50"
                  >
                    {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    <span className="hidden sm:inline">Cancel</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-10 text-center shadow-sm">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ticket className="h-7 w-7 text-gray-400" />
              </div>
              <p className="text-gray-900 font-medium mb-1">No Active Token</p>
              <p className="text-gray-500 text-sm mb-5">
                You don't have any active tokens right now.
              </p>
              <Link
                id="book-token-btn"
                to="/user/book-token"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-colors"
              >
                <Calendar className="h-4 w-4" />
                Book a Token
              </Link>
            </div>
          )}
        </section>

        {/* ── Recent History ────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent History</h2>
            <Link
              to="/user/history"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {recentTokens.length === 0 ? (
              <div className="py-10 text-center">
                <Ticket className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No token history yet.</p>
                <Link
                  to="/user/book-token"
                  className="mt-3 inline-block text-sm text-blue-600 hover:underline"
                >
                  Book your first token
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentTokens.map((token) => (
                  <li
                    key={token._id}
                    className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Ticket className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{token.tokenNumber}</p>
                        <p className="text-xs text-gray-400">
                          {getDeptName(token) !== '—'
                            ? getDeptName(token)
                            : getBranchName(token)}{' '}
                          · {formatRelativeDate(token.createdAt)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={token.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

      <RescheduleModal
        isOpen={isRescheduling}
        onClose={() => setIsRescheduling(false)}
        token={activeToken}
        onRescheduleSuccess={fetchDashboard}
      />
    </div>
  )
}

export default UserDashboard
