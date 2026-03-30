import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Calendar, Clock, MapPin, Users, AlertCircle } from 'lucide-react'
import { useTokenBooking } from '../../hooks/useQueue'
import { tokenAPI } from '../../utils/api'
import toast from 'react-hot-toast'

const bookingSchema = z.object({
  branchId: z.string().min(1, 'Branch is required'),
  departmentId: z.string().min(1, 'Department is required'),
  scheduledTime: z.string().min(1, 'Scheduled time is required'),
  priority: z.enum(['normal', 'high']).default('normal'),
  notes: z.string().max(500).optional()
})

const TokenBooking = () => {
  const { bookToken, isBooking } = useTokenBooking()
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      priority: 'normal'
    }
  })

  const watchedBranchId = watch('branchId')
  const watchedDepartmentId = watch('departmentId')

  // Fetch branches
  const { data: branches, isLoading: branchesLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => apiClient.branches.getAll()
  })

  // Fetch departments when branch is selected
  const { data: departments, isLoading: departmentsLoading } = useQuery({
    queryKey: ['departments', watchedBranchId],
    queryFn: () => apiClient.departments.getAll(watchedBranchId),
    enabled: !!watchedBranchId
  })

  // Get available time slots
  const { data: timeSlots, isLoading: slotsLoading } = useQuery({
    queryKey: ['timeSlots', watchedDepartmentId, watch('scheduledTime')],
    queryFn: async () => {
      if (!watchedDepartmentId) return []
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 7)
      
      // Generate time slots for the next 7 days
      const slots = []
      for (let i = 0; i < 7; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() + i)
        
        for (let hour = 9; hour <= 17; hour++) {
          slots.push({
            id: `${date.toISOString().split('T')[0]}T${hour.toString().padStart(2, '0')}:00`,
            date: date.toISOString().split('T')[0],
            time: `${hour.toString().padStart(2, '0')}:00`,
            display: date.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            }) + ` ${hour}:00`
          })
        }
      }
      return slots
    },
    enabled: !!watchedDepartmentId
  })

  const onSubmit = async (data) => {
    try {
      await bookToken(data)
      reset()
      toast.success('Token booked successfully!')
    } catch (error) {
      // Error is already handled in the hook
    }
  }

  const handleBranchChange = (branchId) => {
    setSelectedBranch(branchId)
    setValue('branchId', branchId)
    setValue('departmentId', '')
    setSelectedDepartment('')
  }

  const handleDepartmentChange = (departmentId) => {
    setSelectedDepartment(departmentId)
    setValue('departmentId', departmentId)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Book a Token</h1>
        <p className="text-gray-600">Schedule your visit and avoid waiting in line</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Branch Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              Select Branch
            </label>
            <select
              {...register('branchId')}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              disabled={branchesLoading}
            >
              <option value="">Choose a branch</option>
              {branches?.data?.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name} - {branch.address}
                </option>
              ))}
            </select>
            {errors.branchId && (
              <p className="mt-1 text-sm text-red-600">{errors.branchId.message}</p>
            )}
          </div>

          {/* Department Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="inline h-4 w-4 mr-1" />
              Select Department
            </label>
            <select
              {...register('departmentId')}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              disabled={!watchedBranchId || departmentsLoading}
            >
              <option value="">Choose a department</option>
              {departments?.data?.map((department) => (
                <option key={department._id} value={department._id}>
                  {department.name}
                  {department.averageServiceTime && (
                    ` (~${department.averageServiceTime} min)`
                  )}
                </option>
              ))}
            </select>
            {errors.departmentId && (
              <p className="mt-1 text-sm text-red-600">{errors.departmentId.message}</p>
            )}
          </div>

          {/* Scheduled Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Select Date & Time
            </label>
            <select
              {...register('scheduledTime')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              disabled={!watchedDepartmentId || slotsLoading}
            >
              <option value="">Choose a time slot</option>
              {timeSlots?.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.display}
                </option>
              ))}
            </select>
            {errors.scheduledTime && (
              <p className="mt-1 text-sm text-red-600">{errors.scheduledTime.message}</p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority Level
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  {...register('priority')}
                  value="normal"
                  className="mr-2"
                />
                <span className="text-sm">Normal</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  {...register('priority')}
                  value="high"
                  className="mr-2"
                />
                <span className="text-sm">High Priority</span>
              </label>
            </div>
            {errors.priority && (
              <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Any special requirements or information..."
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
            )}
          </div>

          {/* Information Box */}
          {selectedDepartment && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Booking Information</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Please arrive 10 minutes before your scheduled time</li>
                    <li>Bring a valid ID for verification</li>
                    <li>You can check your queue status in real-time</li>
                    <li>Cancellation is allowed up to 30 minutes before scheduled time</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isBooking || !watchedBranchId || !watchedDepartmentId || !watch('scheduledTime')}
              className="w-full btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBooking ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Booking Token...
                </div>
              ) : (
                'Book Token'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TokenBooking
