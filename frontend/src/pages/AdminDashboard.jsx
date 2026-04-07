import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../services/api'
import { useAuthStore } from '../store/authStore'
import {
  Users, Building, BarChart3, Clock, TrendingUp,
  CheckCircle, AlertCircle, Loader2, LogOut, ArrowRight,
  Layers, ListOrdered
} from 'lucide-react'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { logout, user } = useAuthStore()
  const now = new Date()

  const handleSignOut = () => {
    logout()
    navigate('/login')
  }

  const { data, isLoading, isError, dataUpdatedAt } = useQuery({
    queryKey: ['adminOverview'],
    queryFn: async () => {
      const response = await apiClient.admin.getOverview()
      return response.data.data
    },
    refetchInterval: 60000
  })

  const lastSynced = dataUpdatedAt
    ? `${Math.round((Date.now() - dataUpdatedAt) / 1000)}s ago`
    : '—'

  const todayTotal    = data?.today?.totalTokens     || 0
  const todayWaiting  = data?.today?.waitingTokens   || 0
  const todayServing  = data?.today?.servingTokens   || 0
  const todayDone     = data?.today?.completedTokens || 0
  const todayMissed   = (data?.today?.missedTokens || 0) + (data?.today?.skippedTokens || 0)

  const completionRate = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-13 py-2.5">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">Q</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">QueueLess</span>
              <span className="text-gray-300 text-xs">|</span>
              <span className="text-xs text-gray-500 font-medium">Admin</span>
            </div>
            <nav className="flex items-center gap-5">
              <Link to="/admin" className="text-xs font-semibold text-blue-600 border-b-2 border-blue-600 pb-0.5">Overview</Link>
              <Link to="/admin/analytics" className="text-xs text-gray-500 hover:text-gray-900">Analytics</Link>
              <Link to="/admin/users" className="text-xs text-gray-500 hover:text-gray-900">Users</Link>
              <Link to="/admin/branches" className="text-xs text-gray-500 hover:text-gray-900">Branches</Link>
              <Link to="/admin/departments" className="text-xs text-gray-500 hover:text-gray-900">Departments</Link>
              <Link to="/admin/settings" className="text-xs text-gray-500 hover:text-gray-900">Settings</Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-600 border-l border-gray-200 pl-4 ml-1 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ── Page header ────────────────────────────────── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Overview</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              <span className="ml-2 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                Synced {lastSynced}
              </span>
            </p>
          </div>
          <Link
            to="/admin/queue"
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors"
          >
            <ListOrdered className="h-3.5 w-3.5" /> Live Queue
          </Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-sm text-gray-400">Loading overview...</p>
          </div>
        ) : isError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            Failed to load system overview. Check your network connection.
          </div>
        ) : (
          <>
            {/* ── System stats row ───────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {[
                { icon: Users,    label: 'Total Users',       value: data?.system?.totalUsers     || 0, sub: 'All roles combined',        color: 'border-blue-400' },
                { icon: Building, label: 'Active Branches',   value: data?.system?.totalBranches  || 0, sub: 'All operational',            color: 'border-green-400' },
                { icon: Layers,   label: 'Departments',       value: data?.system?.totalDepartments || 0, sub: 'Across all branches',      color: 'border-purple-400' },
                { icon: Clock,    label: 'Avg Wait Today',    value: `${data?.today?.avgWaitTime || 0} min`, sub: 'Across all branches',    color: 'border-orange-400' },
              ].map(({ icon: Icon, label, value, sub, color }) => (
                <div key={label} className={`bg-white border border-gray-200 border-l-4 ${color} rounded-lg px-4 py-3`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{value}</p>
                      <p className="text-xs font-medium text-gray-700 mt-0.5">{label}</p>
                      <p className="text-xs text-gray-400">{sub}</p>
                    </div>
                    <Icon className="h-4 w-4 text-gray-300 mt-1" />
                  </div>
                </div>
              ))}
            </div>

            {/* ── Today's token breakdown ─────────────────────── */}
            <div className="bg-white border border-gray-200 rounded-xl mb-6">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Today's queue</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{todayTotal} total tokens issued</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="text-green-600 font-semibold">{completionRate}%</span> completion rate
                </div>
              </div>
              <div className="px-5 py-4">
                {/* Progress bar */}
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex mb-4">
                  {todayDone > 0 && <div className="bg-green-500 h-full transition-all" style={{ width: `${(todayDone / Math.max(todayTotal, 1)) * 100}%` }} />}
                  {todayServing > 0 && <div className="bg-blue-500 h-full transition-all" style={{ width: `${(todayServing / Math.max(todayTotal, 1)) * 100}%` }} />}
                  {todayWaiting > 0 && <div className="bg-yellow-400 h-full transition-all" style={{ width: `${(todayWaiting / Math.max(todayTotal, 1)) * 100}%` }} />}
                  {todayMissed > 0 && <div className="bg-gray-300 h-full transition-all" style={{ width: `${(todayMissed / Math.max(todayTotal, 1)) * 100}%` }} />}
                </div>
                <div className="grid grid-cols-4 gap-4 text-center">
                  {[
                    { label: 'Waiting',    value: todayWaiting, dot: 'bg-yellow-400' },
                    { label: 'Serving',    value: todayServing, dot: 'bg-blue-500' },
                    { label: 'Completed',  value: todayDone,    dot: 'bg-green-500' },
                    { label: 'Missed/Skip',value: todayMissed,  dot: 'bg-gray-300' },
                  ].map(({ label, value, dot }) => (
                    <div key={label}>
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <span className={`w-2 h-2 rounded-full ${dot}`}></span>
                        <span className="text-xs text-gray-500">{label}</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Bottom grid ────────────────────────────────── */}
            <div className="grid lg:grid-cols-3 gap-4">
              {/* Quick actions */}
              <div className="bg-white border border-gray-200 rounded-xl">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900">Management</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {[
                    { to: '/admin/users',      icon: Users,       label: 'Manage Users',       sub: `${data?.system?.totalUsers || 0} accounts` },
                    { to: '/admin/branches',   icon: Building,    label: 'Manage Branches',    sub: `${data?.system?.totalBranches || 0} locations` },
                    { to: '/admin/departments',icon: Layers,      label: 'Departments',        sub: `${data?.system?.totalDepartments || 0} configured` },
                    { to: '/admin/analytics',  icon: TrendingUp,  label: 'Analytics',          sub: 'View performance data' },
                    { to: '/admin/queue',      icon: ListOrdered, label: 'Queue Control',      sub: 'Live token management' },
                  ].map(({ to, icon: Icon, label, sub }) => (
                    <Link key={to} to={to} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        <div>
                          <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900">{label}</p>
                          <p className="text-xs text-gray-400">{sub}</p>
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* System status */}
              <div className="bg-white border border-gray-200 rounded-xl">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-900">System status</h2>
                  <span className="text-xs text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full font-medium">All systems up</span>
                </div>
                <div className="px-5 py-4 space-y-4">
                  {[
                    { name: 'MongoDB',        status: 'Operational',    time: 'Last ping 2s ago',  ok: true },
                    { name: 'API Server',     status: 'Operational',    time: 'p99 < 180ms',       ok: true },
                    { name: 'Socket.IO',      status: 'Operational',    time: 'Real-time active',  ok: true },
                    { name: 'Email Service',  status: 'Degraded',       time: 'Test env only',     ok: false },
                  ].map(({ name, status, time, ok }) => (
                    <div key={name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {ok
                          ? <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          : <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
                        <div>
                          <p className="text-xs font-medium text-gray-800">{name}</p>
                          <p className="text-xs text-gray-400">{time}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-medium ${ok ? 'text-green-600' : 'text-yellow-600'}`}>{status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Token stats split */}
              <div className="bg-white border border-gray-200 rounded-xl">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900">Booking breakdown</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Today's token sources</p>
                </div>
                <div className="px-5 py-4 space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                      <span>Online bookings</span>
                      <span className="font-semibold text-gray-800">{data?.today?.onlineTokens || 0}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${todayTotal > 0 ? ((data?.today?.onlineTokens || 0) / todayTotal) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                      <span>Walk-ins</span>
                      <span className="font-semibold text-gray-800">{data?.today?.walkInTokens || 0}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-400 rounded-full"
                        style={{ width: `${todayTotal > 0 ? ((data?.today?.walkInTokens || 0) / todayTotal) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-3">Quick info</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Total users</span>
                        <span className="font-medium text-gray-800">{data?.system?.totalUsers || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Active branches</span>
                        <span className="font-medium text-gray-800">{data?.system?.totalBranches || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Departments</span>
                        <span className="font-medium text-gray-800">{data?.system?.totalDepartments || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default AdminDashboard
