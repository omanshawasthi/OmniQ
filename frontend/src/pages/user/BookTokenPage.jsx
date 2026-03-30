import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, Users, CheckCircle } from 'lucide-react'
import { tokenAPI, branchAPI } from '../../utils/api'

const BookTokenPage = () => {
  const [formData, setFormData] = useState({
    serviceType: '',
    branch: '',
    priority: 'normal',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdToken, setCreatedToken] = useState(null)
  const [loadingData, setLoadingData] = useState(true)
  const [branches, setBranches] = useState([])
  const [departments, setDepartments] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    loadBookingData()
  }, [])

  useEffect(() => {
    if (formData.branch) {
      loadDepartments()
    } else {
      setDepartments([])
    }
  }, [formData.branch])

  const loadDepartments = async () => {
    try {
      const departmentsResponse = await branchAPI.getBranchDepartments(formData.branch)
      setDepartments(departmentsResponse.data.data)
    } catch (error) {
      console.error('Error loading departments:', error)
      setError('Failed to load departments')
    }
  }

  const loadBookingData = async () => {
    try {
      // Load real branches from backend
      const branchesResponse = await branchAPI.getBranches()
      
      setBranches(branchesResponse.data.data)
      
      // Load departments when branch is selected
      if (formData.branch) {
        const departmentsResponse = await branchAPI.getBranchDepartments(formData.branch)
        setDepartments(departmentsResponse.data.data)
      }
      
      setLoadingData(false)
    } catch (error) {
      console.error('Error loading booking data:', error)
      setError('Failed to load booking data')
      setLoadingData(false)
    }
  }

  const getFilteredDepartments = () => {
    if (!formData.branch) return []
    return departments.filter(dept => dept.branchId === formData.branch)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      // Map form data to API format
      const bookingData = {
        branchId: formData.branch,
        departmentId: formData.serviceType,
        scheduledTime: new Date().toISOString(),
        priority: formData.priority,
        notes: formData.notes
      }

      console.log('Booking token:', bookingData)
      
      // Make real API call to book token
      const response = await tokenAPI.bookToken(bookingData)
      
      setCreatedToken(response.data.data.token)
      setShowSuccess(true)
      setIsSubmitting(false)
      
      // Reset form
      setFormData({
        serviceType: '',
        branch: '',
        priority: 'normal',
        notes: ''
      })
    } catch (error) {
      console.error('Booking error:', error)
      setError(error.response?.data?.message || 'Failed to book token. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Reset service type when branch changes
    if (name === 'branch') {
      setFormData(prev => ({
        ...prev,
        serviceType: ''
      }))
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-r-2 border-primary-600"></div>
      </div>
    )
  }

  if (showSuccess && createdToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Token Booked Successfully!</h2>
          <div className="mb-6">
            <p className="text-gray-600 mb-2">Your token has been created</p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-primary-600">{createdToken.tokenNumber}</p>
              <p className="text-sm text-gray-600">Estimated wait: {createdToken.estimatedWaitTime} minutes</p>
            </div>
          </div>
          <div className="space-y-3">
            <Link
              to="/user/history"
              className="block w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              View My Tokens
            </Link>
            <Link
              to="/user"
              className="block w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const filteredDepartments = getFilteredDepartments()

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
              <h1 className="text-xl font-semibold text-gray-900">Book Token</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Book a Token</h2>
          <p className="text-gray-600">Schedule an appointment or join the queue</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}

        {/* Booking Form */}
        <div className="bg-white shadow-sm rounded-lg border">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Branch Selection */}
            <div>
              <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-2">
                Branch <span className="text-red-500">*</span>
              </label>
              <select
                id="branch"
                name="branch"
                value={formData.branch}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a branch</option>
                {branches.map(branch => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name} - {branch.address}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Type Selection */}
            <div>
              <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-2">
                Service Type <span className="text-red-500">*</span>
              </label>
              <select
                id="serviceType"
                name="serviceType"
                value={formData.serviceType}
                onChange={handleInputChange}
                required
                disabled={!formData.branch}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
              >
                <option value="">Select a service</option>
                {filteredDepartments.map(dept => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} - {dept.averageServiceTime} min avg
                  </option>
                ))}
              </select>
              {!formData.branch && (
                <p className="text-sm text-gray-500 mt-1">Please select a branch first</p>
              )}
            </div>

            {/* Priority Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="priority"
                    value="normal"
                    checked={formData.priority === 'normal'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Normal (Standard wait time)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="priority"
                    value="priority"
                    checked={formData.priority === 'priority'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Priority (Reduced wait time)</span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Any special requirements or notes..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !formData.branch || !formData.serviceType}
                className="inline-flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-r-2 border-white mr-2"></div>
                    Booking...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Token
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default BookTokenPage
