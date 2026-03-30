import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
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
  Share2
} from 'lucide-react'
import { tokenAPI } from '../../utils/api.js'
import { TokenQRCode } from '../../components/common/QRCodeDisplay.jsx'

const TokenDetailsPage = () => {
  const { id } = useParams()
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPrintView, setShowPrintView] = useState(false)

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
        setError('Token not found')
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view this token')
      } else {
        setError('Failed to load token details. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'waiting': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'serving': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'completed': return 'text-green-600 bg-green-50 border-green-200'
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200'
      case 'held': return 'text-orange-600 bg-orange-50 border-orange-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return <CheckCircle className="h-5 w-5" />
      case 'cancelled': return <XCircle className="h-5 w-5" />
      case 'serving': return <AlertCircle className="h-5 w-5" />
      default: return <Clock className="h-5 w-5" />
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // Create a simple text representation of the token
    const tokenText = `
QUEUELESS TOKEN
================

Token Number: ${token?.tokenNumber}
Status: ${token?.status?.toUpperCase()}
Date: ${formatDate(token?.scheduledTime)}
Time: ${formatTime(token?.scheduledTime)}

Branch: ${token?.branch?.name}
Address: ${token?.branch?.address}
Phone: ${token?.branch?.phone}

Department: ${token?.department?.name}

User: ${token?.user?.name}
Email: ${token?.user?.email}
Phone: ${token?.user?.phone}

Booking ID: ${token?._id}
Created: ${formatDate(token?.createdAt)}

================
Generated on: ${new Date().toLocaleString()}
    `.trim()

    // Create blob and download
    const blob = new Blob([tokenText], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `token-${token?.tokenNumber}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Queueless Token ${token?.tokenNumber}`,
          text: `My token number is ${token?.tokenNumber} for ${token?.department?.name} at ${token?.branch?.name} on ${formatDate(token?.scheduledTime)}.`,
          url: window.location.href
        })
      } catch (err) {
        console.log('Share cancelled or failed')
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `My token number is ${token?.tokenNumber} for ${token?.department?.name} at ${token?.branch?.name} on ${formatDate(token?.scheduledTime)}.`
      navigator.clipboard.writeText(shareText)
      alert('Token details copied to clipboard!')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading token details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={loadTokenDetails}
              className="block w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Retry
            </button>
            <Link
              to="/user"
              className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-center"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Token Not Found</h2>
          <p className="text-gray-600 mb-6">The token you're looking for doesn't exist.</p>
          <Link
            to="/user"
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Print View Component
  if (showPrintView) {
    return (
      <div className="min-h-screen bg-white p-8 print:p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">QUEUELESS TOKEN</h1>
            <p className="text-gray-600">Smart Queue Management System</p>
          </div>

          {/* Token Card */}
          <div className="border-2 border-gray-300 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{token.tokenNumber}</h2>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(token.status)}`}>
                  {getStatusIcon(token.status)}
                  <span className="ml-1">{token.status?.charAt(0).toUpperCase() + token.status?.slice(1)}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Booking ID</p>
                <p className="font-mono text-sm">{token._id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Date</p>
                <p className="font-semibold">{formatDate(token.scheduledTime)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Time</p>
                <p className="font-semibold">{formatTime(token.scheduledTime)}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Branch</p>
                <p className="font-semibold">{token.branch?.name}</p>
                <p className="text-sm text-gray-600">{token.branch?.address}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Department</p>
                <p className="font-semibold">{token.department?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Customer</p>
                <p className="font-semibold">{token.user?.name}</p>
                <p className="text-sm text-gray-600">{token.user?.phone}</p>
              </div>
            </div>
          </div>

          {/* QR Code Placeholder */}
          <div className="text-center mb-6">
            <div className="inline-block border-2 border-gray-300 rounded-lg p-4">
              <QrCode className="h-32 w-32 text-gray-400" />
              <p className="text-sm text-gray-600 mt-2">Scan for details</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600">
            <p>Generated on {new Date().toLocaleString()}</p>
            <p>Please bring this token when you visit</p>
          </div>
        </div>

        <div className="no-print mt-8 text-center">
          <button
            onClick={() => setShowPrintView(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close Print View
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/user" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Token Details</h1>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                title="Share token"
              >
                <Share2 className="h-5 w-5" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                title="Download token"
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                onClick={handlePrint}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                title="Print token"
              >
                <Printer className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Token Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                {/* Token Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{token.tokenNumber}</h2>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(token.status)}`}>
                      {getStatusIcon(token.status)}
                      <span className="ml-1">{token.status?.charAt(0).toUpperCase() + token.status?.slice(1)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Booking ID</p>
                    <p className="font-mono text-sm">{token._id}</p>
                  </div>
                </div>

                {/* Token Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date & Time */}
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Date</p>
                        <p className="font-semibold text-gray-900">{formatDate(token.scheduledTime)}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Time</p>
                        <p className="font-semibold text-gray-900">{formatTime(token.scheduledTime)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Branch</p>
                        <p className="font-semibold text-gray-900">{token.branch?.name}</p>
                        <p className="text-sm text-gray-600">{token.branch?.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Department</p>
                        <p className="font-semibold text-gray-900">{token.department?.name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="border-t mt-6 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Created On</p>
                      <p className="font-medium text-gray-900">{formatDate(token.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Booking Type</p>
                      <p className="font-medium text-gray-900 capitalize">{token.bookingType || 'Online'}</p>
                    </div>
                    {token.notes && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">Notes</p>
                        <p className="font-medium text-gray-900">{token.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* QR Code */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Token QR Code</h3>
                <TokenQRCode 
                  token={token} 
                  size={200} 
                  showActions={true}
                  className="w-full"
                />
                <p className="text-sm text-gray-600 text-center mt-4">
                  Show this QR code at the counter for quick check-in
                </p>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">{token.user?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{token.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{token.user?.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowPrintView(true)}
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    <Printer className="h-4 w-4 inline mr-2" />
                    Print Token
                  </button>
                  <button
                    onClick={handleDownload}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4 inline mr-2" />
                    Download
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    <Share2 className="h-4 w-4 inline mr-2" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default TokenDetailsPage
