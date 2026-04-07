import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Building2, CheckCircle } from 'lucide-react'
import { publicAPI } from '../utils/api.js'
import { useAuthStore } from '../store/authStore.js'

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
    assignedBranch: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [branches, setBranches] = useState([])

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await publicAPI.getBranches()
        const list = Array.isArray(response) ? response : (response?.branches || [])
        setBranches(list)
      } catch (err) {
        console.error('Failed to fetch branches:', err)
      }
    }
    fetchBranches()
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        setIsLoading(false)
        return
      }
      if (formData.role === 'STAFF' && !formData.assignedBranch) {
        setError('Please select your assigned hospital')
        setIsLoading(false)
        return
      }
      const registrationData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: formData.role.toLowerCase(),
        assignedBranch: formData.role === 'STAFF' ? formData.assignedBranch : undefined
      }
      await useAuthStore.getState().register(registrationData)
      if (formData.role === 'STAFF') {
        setIsSuccess(true)
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Account created</h2>
          <p className="text-sm text-gray-500 mb-2">
            Your staff account has been submitted and is pending administrator approval.
          </p>
          <p className="text-xs text-gray-400 mb-6">
            You will be able to sign in once your account is activated by the branch admin.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Left panel ──────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[44%] bg-gray-900 flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="text-white font-semibold">QueueLess</span>
          </Link>

          <div className="mb-8">
            <p className="text-xs text-blue-400 uppercase tracking-widest font-semibold mb-3">Getting started</p>
            <h2 className="text-xl font-bold text-white mb-3 leading-snug">
              Register to start skipping the queue.
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Patients book tokens from home. Staff manage queues from a live dashboard. Admins control everything from one panel.
            </p>
          </div>

          <div className="space-y-5 mb-8">
            {[
              { step: '1', label: 'Choose your role', sub: 'Patient (standard user) or Hospital Staff' },
              { step: '2', label: 'Fill your details', sub: 'Name, email, phone. Takes 60 seconds.' },
              { step: '3', label: 'Start using QueueLess', sub: 'Staff accounts need admin activation.' },
            ].map(({ step, label, sub }) => (
              <div key={step} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">{step}</span>
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hospital image in frame */}
        <div className="relative z-10 rounded-xl overflow-hidden border border-gray-700 bg-gray-800 shadow-lg">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-700">
            <span className="text-xs text-gray-500 font-medium">Healthcare queue management</span>
          </div>
          <img
            src="/images/doctor-patient.png"
            alt="Doctor attending to patient"
            className="w-full h-36 object-contain bg-blue-50"
            onError={(e) => { e.target.parentElement.style.display = 'none'; }}
          />
          <div className="px-3 py-2">
            <p className="text-xs text-gray-500">Optimized OPD flow for <span className="text-blue-400">hospitals & clinics</span></p>
          </div>
        </div>
      </div>

      {/* ── Right panel: Form ──────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-12 overflow-y-auto">
        <div className="w-full max-w-sm mx-auto lg:mx-0">

          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="text-gray-900 font-semibold">QueueLess</span>
          </Link>

          <h1 className="text-xl font-bold text-gray-900 mb-1">Create your account</h1>
          <p className="text-sm text-gray-500 mb-6">
            Already registered?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
          </p>

          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">I am a</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition"
              >
                <option value="USER">Patient / Standard User</option>
                <option value="STAFF">Hospital Staff (Employee)</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {formData.role === 'STAFF'
                  ? 'Staff accounts require approval from your branch admin before you can log in.'
                  : 'Patient accounts are activated immediately — book your first token right after signing up.'}
              </p>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="As it appears on your ID"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="you@example.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="10-digit mobile number"
              />
            </div>

            {/* Branch — staff only */}
            {formData.role === 'STAFF' && (
              <div>
                <label htmlFor="assignedBranch" className="block text-sm font-medium text-gray-700 mb-1">
                  Your hospital / branch <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <select
                    id="assignedBranch"
                    name="assignedBranch"
                    required
                    value={formData.assignedBranch}
                    onChange={handleChange}
                    className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition"
                  >
                    <option value="">Select your hospital...</option>
                    {branches.length > 0
                      ? branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)
                      : <option disabled>Loading...</option>
                    }
                  </select>
                </div>
              </div>
            )}

            {/* Passwords */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full px-3 py-2.5 pr-9 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Min 6 chars"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full px-3 py-2.5 pr-9 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Same again"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400">
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2 pt-1">
              <input
                id="agree-terms"
                type="checkbox"
                required
                className="h-4 w-4 text-blue-600 border-gray-300 rounded mt-0.5 flex-shrink-0"
              />
              <label htmlFor="agree-terms" className="text-xs text-gray-500">
                I agree to the{' '}
                <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Creating account...</>
              ) : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
