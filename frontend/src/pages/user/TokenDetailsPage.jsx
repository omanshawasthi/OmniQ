import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import RescheduleModal from '../../components/user/RescheduleModal'
import { 
  ArrowLeft, 
  QrCode, 
  Download, 
  Printer, 
  Calendar, 
  Clock, 
  MapPin, 
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Share2,
  Activity
} from 'lucide-react'
import { tokenAPI } from '../../utils/api.js'
import { TokenQRCode } from '../../components/common/QRCodeDisplay.jsx'

const TokenDetailsPage = () => {
  const { id } = useParams()
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPrintView, setShowPrintView] = useState(false)
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadTokenDetails()
  }, [id])

  const loadTokenDetails = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const tokenData = await tokenAPI.getToken(id)
      setToken(tokenData.token || tokenData)
    } catch (err) {
      console.error('Token details load error:', err)
      if (err.response?.status === 404) {
        setError('TOKEN_NOT_FOUND')
      } else if (err.response?.status === 403) {
        setError('ACCESS_DENIED')
      } else {
        setError('Failed to load token details. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-IN', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatTime = (dateString) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const normalizeStatus = (s) => (s || '').toLowerCase()

  const getStatusInfo = (status) => {
    const s = normalizeStatus(status)
    switch (s) {
      case 'waiting': return { label: 'Waiting', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: <Clock className="h-5 w-5" /> }
      case 'serving': return { label: 'Now Serving', color: 'text-green-600 bg-green-50 border-green-200', icon: <Activity className="h-5 w-5" /> }
      case 'completed': return { label: 'Completed', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: <CheckCircle className="h-5 w-5" /> }
      case 'cancelled': return { label: 'Cancelled', color: 'text-red-600 bg-red-50 border-red-200', icon: <XCircle className="h-5 w-5" /> }
      case 'held': return { label: 'On Hold', color: 'text-orange-600 bg-orange-50 border-orange-200', icon: <AlertCircle className="h-5 w-5" /> }
      case 'missed': return { label: 'Missed', color: 'text-gray-600 bg-gray-50 border-gray-200', icon: <XCircle className="h-5 w-5" /> }
      default: return { label: status || 'Unknown', color: 'text-gray-600 bg-gray-50 border-gray-200', icon: <Clock className="h-5 w-5" /> }
    }
  }

  const handlePrint = () => window.print()

  const handleDownload = () => {
    const tokenText = `
QUEUELESS TOKEN
================
Token Number: ${token?.tokenNumber}
Status: ${token?.status}
Service: ${token?.departmentId?.name}
Branch: ${token?.branchId?.name}
Date: ${formatDate(token?.scheduledTime)}
Time: ${formatTime(token?.scheduledTime)}
================
    `.trim()
    const blob = new Blob([tokenText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `token-${token?.tokenNumber}.txt`
    a.click()
  }

  const handleCancelToken = async () => {
    if (!token) return
    if (!window.confirm('Are you sure you want to cancel this token? This action cannot be undone.')) return

    setIsCancelling(true)
    try {
      await tokenAPI.cancelToken(token._id)
      toast.success('Token cancelled successfully')
      loadTokenDetails()
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
    return s === 'waiting' || s === 'held'
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Token ${token?.tokenNumber}`,
          text: `My token is ${token?.tokenNumber} for ${token?.departmentId?.name}.`,
          url: window.location.href
        })
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied!')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500 animate-pulse">Fetching token security check...</p>
        </div>
      </div>
    )
  }

  if (error === 'TOKEN_NOT_FOUND' || error === 'ACCESS_DENIED') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            {error === 'TOKEN_NOT_FOUND' ? <XCircle className="h-10 w-10 text-red-500" /> : <AlertCircle className="h-10 w-10 text-red-500" />}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error === 'TOKEN_NOT_FOUND' ? 'Token Not Found' : 'Access Denied'}
          </h2>
          <p className="text-gray-500 mb-8">
            {error === 'TOKEN_NOT_FOUND' 
              ? "The token ID you are looking for does not exist or has been removed." 
              : "You don't have permission to view this token. Tokens are private to the account that booked them."}
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/user/my-tokens" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
              Go to My Tokens
            </Link>
            <Link to="/user" className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">
              User Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border text-center max-w-sm">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={loadTokenDetails} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">Try Again</button>
        </div>
      </div>
    )
  }

  const sInfo = getStatusInfo(token.status)
  const isWaiting = normalizeStatus(token.status) === 'waiting'
  const isServing = normalizeStatus(token.status) === 'serving'

  const steps = [
    { id: 'booked', label: 'Booked', done: true },
    { id: 'waiting', label: 'Waiting', done: ['waiting', 'serving', 'completed'].includes(normalizeStatus(token.status)) },
    { id: 'serving', label: 'Serving', done: ['serving', 'completed'].includes(normalizeStatus(token.status)) },
    { id: 'completed', label: 'Done', done: normalizeStatus(token.status) === 'completed' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-2xl font-bold">QUEUELESS TOKEN</h1>
        <p className="text-gray-500">Service Confirmation</p>
      </div>

      <header className="bg-white border-b sticky top-0 z-10 no-print">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/user/my-tokens" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </Link>
            <h1 className="text-lg font-bold text-gray-900">Token Detail</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleShare} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Share2 className="h-5 w-5" /></button>
            <button onClick={handleDownload} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Download className="h-5 w-5" /></button>
            <button onClick={handlePrint} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Printer className="h-5 w-5" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div className="text-center md:text-left">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">YOUR TOKEN NUMBER</p>
                    <h2 className="text-6xl font-black text-blue-600 tracking-tight">{token.tokenNumber}</h2>
                  </div>
                  <div className="flex flex-col items-center md:items-end gap-2">
                    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border ${sInfo.color}`}>
                      {sInfo.icon}
                      {sInfo.label}
                    </div>
                    {isWaiting && (
                      <span className="text-xs font-medium text-blue-600 animate-pulse">Refresh to update position</span>
                    )}
                  </div>
                </div>

                {(isWaiting || isServing) && (
                  <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
                      <p className="text-xs font-bold text-blue-400 uppercase mb-1">POSITION</p>
                      <p className="text-3xl font-black text-blue-700">{token.queuePosition || '—'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">EST. WAIT</p>
                      <p className="text-3xl font-black text-gray-700">{token.estimatedWaitTime || '0'}<span className="text-sm font-bold ml-1">MIN</span></p>
                    </div>
                  </div>
                )}

                <div className="relative mb-10 px-2 no-print">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2"></div>
                  <div className="relative flex justify-between">
                    {steps.map((step) => (
                      <div key={step.id} className="flex flex-col items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 z-10 ${step.done ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-200'}`}></div>
                        <span className={`text-[10px] font-bold uppercase tracking-tighter ${step.done ? 'text-blue-600' : 'text-gray-400'}`}>{step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-100">
                  <div className="space-y-6">
                    <DetailItem icon={<MapPin className="text-blue-500" />} label="Service Location" value={token.branchId?.name} subValue={token.branchId?.address} />
                    <DetailItem icon={<Activity className="text-blue-500" />} label="Department" value={token.departmentId?.name} />
                  </div>
                  <div className="space-y-6">
                    <DetailItem icon={<Calendar className="text-blue-500" />} label="Appointment Date" value={formatDate(token.scheduledTime)} />
                    <DetailItem icon={<Clock className="text-blue-500" />} label="Scheduled Time" value={formatTime(token.scheduledTime)} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-600 rounded-3xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 no-print">
              <div>
                <h3 className="text-lg font-bold mb-1">Need real-time tracking?</h3>
                <p className="text-indigo-100 text-sm">Open the live tracking map to see exact counter status.</p>
              </div>
              <Link to={`/live-queue/${id}`} className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors whitespace-nowrap">
                Live Track Queue
              </Link>
            </div>

            {normalizeStatus(token.status) === 'waiting' && (
              <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">MANAGE TOKEN</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setIsRescheduling(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all shadow-sm"
                  >
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Reschedule Appointment
                  </button>
                  {canCancel(token) && (
                    <button
                      onClick={handleCancelToken}
                      disabled={isCancelling}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-all border border-red-100 disabled:opacity-50 shadow-sm shadow-red-100/50"
                    >
                      {isCancelling ? <Loader2 className="h-5 w-5 animate-spin" /> : <XCircle className="h-5 w-5" />}
                      Cancel Token
                    </button>
                  )}
                </div>
                <p className="mt-4 text-[11px] text-gray-400 text-center">
                  Changes to tokens are only allowed according to business policies. Rescheduling updates your wait time based on the new slot.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 text-center flex flex-col items-center">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">CHECK-IN QR CODE</h3>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-6">
                <TokenQRCode token={token} size={180} />
              </div>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                Scan this at the branch kiosk or show it to the operator for verified check-in.
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">BOOKING INFO</h3>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Booked For</p>
                  <p className="text-sm font-bold text-gray-900">{token.user?.name}</p>
                  <p className="text-xs text-gray-500">{token.user?.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Priority Type</p>
                  <p className="text-sm font-bold text-gray-900 capitalize">{token.priority || 'Normal'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Booking ID</p>
                  <p className="text-[10px] font-mono text-gray-400 truncate">{token._id}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      <RescheduleModal
        isOpen={isRescheduling}
        onClose={() => setIsRescheduling(false)}
        token={token}
        onRescheduleSuccess={loadTokenDetails}
      />
    </div>
  )
}

const DetailItem = ({ icon, label, value, subValue }) => (
  <div className="flex gap-4">
    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-bold text-gray-900 leading-tight">{value || '—'}</p>
      {subValue && <p className="text-xs text-gray-500 mt-0.5">{subValue}</p>}
    </div>
  </div>
)

export default TokenDetailsPage
