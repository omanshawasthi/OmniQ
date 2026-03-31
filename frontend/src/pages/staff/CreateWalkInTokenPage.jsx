import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, UserPlus, LogOut, Loader2, CheckCircle } from 'lucide-react'
import { staffAPI, branchAPI } from '../../utils/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const CreateWalkInTokenPage = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const [branches, setBranches] = useState([])
  const [departments, setDepartments] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdToken, setCreatedToken] = useState(null)

  const [form, setForm] = useState({
    guestName: '',
    guestPhone: '',
    branchId: '',
    departmentId: '',
    priority: 'normal',
    notes: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadBranches()
  }, [])

  useEffect(() => {
    if (form.branchId) {
      loadDepartments(form.branchId)
    } else {
      setDepartments([])
      setForm(prev => ({ ...prev, departmentId: '' }))
    }
  }, [form.branchId])

  const loadBranches = async () => {
    try {
      const data = await branchAPI.getBranches()
      setBranches(data || [])
    } catch {
      toast.error('Failed to load branches')
    } finally {
      setLoadingData(false)
    }
  }

  const loadDepartments = async (branchId) => {
    try {
      const data = await branchAPI.getBranchDepartments(branchId)
      setDepartments(data || [])
      setForm(prev => ({ ...prev, departmentId: '' }))
    } catch {
      toast.error('Failed to load departments')
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!form.guestName.trim()) newErrors.guestName = 'Visitor name is required'
    if (!form.branchId) newErrors.branchId = 'Branch is required'
    if (!form.departmentId) newErrors.departmentId = 'Service is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const payload = {
        name: form.guestName.trim(),
        phone: form.guestPhone.trim() || undefined,
        branchId: form.branchId,
        departmentId: form.departmentId,
        priority: form.priority,
        notes: form.notes.trim() || undefined
      }

      const token = await staffAPI.createWalkIn(payload)
      const tokenData = token?.token || token
      setCreatedToken(tokenData)
      toast.success(`Token ${tokenData.tokenNumber} created successfully!`)
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create walk-in token'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleCreateAnother = () => {
    setCreatedToken(null)
    setForm({ guestName: '', guestPhone: '', branchId: '', departmentId: '', priority: 'normal', notes: '' })
    setErrors({})
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Success screen
  if (createdToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-9 h-9 text-green-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Token Created!</h2>
          <p className="text-gray-500 mb-6">Walk-in visitor has been added to the queue.</p>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
            <p className="text-5xl font-black text-blue-600 mb-3">{createdToken.tokenNumber}</p>
            <p className="text-sm font-semibold text-gray-700">{createdToken.metadata?.walkInName || createdToken.userId?.name}</p>
            <p className="text-xs text-gray-500 mt-1">{createdToken.departmentId?.name} · {createdToken.branchId?.name}</p>
            <div className="flex justify-center gap-2 mt-3">
              <span className={`text-xs px-2.5 py-1 rounded-md font-bold uppercase ${createdToken.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                {createdToken.priority || 'normal'}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-md font-bold uppercase bg-yellow-100 text-yellow-700">Waiting</span>
              <span className="text-xs px-2.5 py-1 rounded-md font-bold uppercase bg-gray-100 text-gray-600">Walk-in</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleCreateAnother}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Create Another Token
            </button>
            <Link
              to="/staff/queue"
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-lg transition-colors text-center"
            >
              View Today's Queue
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link to="/staff" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Add Walk-in Token</h1>
            </div>
            <nav className="flex items-center gap-6">
              <Link to="/staff/queue" className="text-gray-500 hover:text-blue-600 font-medium text-sm transition-colors">Today's Queue</Link>
              <button onClick={handleLogout} className="flex items-center gap-2 text-gray-500 hover:text-red-600 text-sm font-medium transition-colors border-l pl-6">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">New Walk-in Visitor</h2>
          <p className="text-gray-500 mt-1 text-sm">Add a visitor to the live queue without a prior booking.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Visitor Name */}
              <div>
                <label htmlFor="guestName" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Visitor Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="guestName"
                  name="guestName"
                  type="text"
                  value={form.guestName}
                  onChange={handleChange}
                  placeholder="Enter visitor's full name"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.guestName ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                />
                {errors.guestName && <p className="text-red-500 text-xs mt-1">{errors.guestName}</p>}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="guestPhone" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Phone Number <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="guestPhone"
                  name="guestPhone"
                  type="tel"
                  value={form.guestPhone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Branch */}
              <div>
                <label htmlFor="branchId" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Branch <span className="text-red-500">*</span>
                </label>
                <select
                  id="branchId"
                  name="branchId"
                  value={form.branchId}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${errors.branchId ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="">Select a branch</option>
                  {branches.map(b => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
                {errors.branchId && <p className="text-red-500 text-xs mt-1">{errors.branchId}</p>}
              </div>

              {/* Department */}
              <div>
                <label htmlFor="departmentId" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Service / Department <span className="text-red-500">*</span>
                </label>
                <select
                  id="departmentId"
                  name="departmentId"
                  value={form.departmentId}
                  onChange={handleChange}
                  disabled={!form.branchId}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-400 ${errors.departmentId ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="">{form.branchId ? 'Select a service' : 'Select a branch first'}</option>
                  {departments.map(d => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
                {errors.departmentId && <p className="text-red-500 text-xs mt-1">{errors.departmentId}</p>}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
                <div className="flex gap-3">
                  {['normal', 'high'].map(p => (
                    <label key={p} className={`flex-1 flex items-center justify-center gap-2 py-2.5 border rounded-lg cursor-pointer text-sm font-semibold transition-colors ${form.priority === p ? (p === 'high' ? 'bg-orange-500 text-white border-orange-500' : 'bg-blue-600 text-white border-blue-600') : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                      <input type="radio" name="priority" value={p} checked={form.priority === p} onChange={handleChange} className="sr-only" />
                      {p === 'normal' ? 'Normal' : '⚡ High Priority'}
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Notes <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="notes"
                  name="notes"
                  type="text"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Any special notes..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

            </div>

            {/* Submit */}
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-sm"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Creating Token...</>
                ) : (
                  <><UserPlus className="w-5 h-5" /> Add to Queue</>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default CreateWalkInTokenPage
