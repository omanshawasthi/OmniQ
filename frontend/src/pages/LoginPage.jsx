import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { authAPI } from '../utils/api.js'
import { useAuthStore } from '../store/authStore.js'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const isLoading = useAuthStore((state) => state.isLoading)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login({ email: email.trim(), password })
      const userRole = useAuthStore.getState().user?.role
      if (userRole === 'ADMIN') navigate('/admin')
      else if (userRole === 'STAFF') navigate('/staff')
      else navigate('/dashboard')
    } catch (err) {
      console.error('Login error:', err)
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Left panel ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[44%] bg-gray-900 flex-col justify-between p-10 relative overflow-hidden">
        {/* Subtle grid texture */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="text-white font-semibold">QueueLess</span>
          </Link>

          <div className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-3 leading-snug">
              Hospital queue management<br />
              <span className="text-blue-400">that actually works.</span>
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Patients book tokens online, track their position live, and walk in only when it's their turn.
            </p>
          </div>

          <ul className="space-y-4">
            {[
              { label: 'Book OPD tokens from any device', sub: 'No counter visit required' },
              { label: 'Live queue position tracking', sub: 'Updates in real-time via socket' },
              { label: 'Staff dashboard for calling tokens', sub: 'Walk-in + online queue unified' },
              { label: 'Admin control across branches', sub: 'Departments, staff, reports' },
            ].map(({ label, sub }) => (
              <li key={label} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <div>
                  <p className="text-sm text-white font-medium">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom image — flush to panel edges */}
        <div className="relative z-10 mt-2">
          <p className="text-xs text-gray-600 mb-2 uppercase tracking-widest font-semibold">The old way</p>
          <div className="w-full overflow-hidden rounded-lg" style={{ aspectRatio: '16/7' }}>
            <img
              src="/images/queue-line.png"
              alt="Long patient queue"
              className="w-full h-full object-cover object-center"
              style={{ mixBlendMode: 'multiply' }}
              onError={(e) => { e.target.parentElement.style.display = 'none'; }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">45–90 min avg. wait at OPD counters</p>
        </div>
      </div>

      {/* ── Right panel: Form ──────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-12">
        <div className="w-full max-w-sm mx-auto lg:mx-0">

          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="text-gray-900 font-semibold">QueueLess</span>
          </Link>

          <h1 className="text-xl font-bold text-gray-900 mb-1">Sign in to your account</h1>
          <p className="text-sm text-gray-500 mb-7">
            New user?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">Create an account</Link>
          </p>

          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="you@example.com"
              />
              <p className="text-xs text-gray-400 mt-1">Use the email registered with your hospital or clinic</p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Signing in...</>
              ) : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Having trouble signing in? Contact your hospital's system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
