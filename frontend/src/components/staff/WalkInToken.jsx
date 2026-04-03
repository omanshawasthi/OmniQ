import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Users, Plus, Search, AlertCircle } from 'lucide-react'
import { useQueueActions } from '../../hooks/useQueue'
import { tokenAPI, queueAPI } from '../../utils/api'
import toast from 'react-hot-toast'

const walkInSchema = z.object({
  branchId: z.string().min(1, 'Branch is required'),
  departmentId: z.string().min(1, 'Department is required'),
  userId: z.string().optional(),
  name: z.string().min(2, 'Name is required when no user is selected'),
  email: z.string().email('Valid email is required when no user is selected'),
  phone: z.string().optional().refine(
    val => !val || /^\d{10}$/.test(val.replace(/\s+/g, '')), 
    'Phone number must be exactly 10 digits'
  ),
  priority: z.enum(['normal', 'high']).default('normal'),
  notes: z.string().max(500).optional()
})

const WalkInToken = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const { callNext } = useQueueActions()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
    setError
  } = useForm({
    resolver: zodResolver(walkInSchema),
    defaultValues: {
      priority: 'normal'
    }
  })

  const watchedBranchId = watch('branchId')
  const watchedDepartmentId = watch('departmentId')
  const watchedUserId = watch('userId')

  // Create walk-in token mutation
  const createWalkInMutation = useMutation({
    mutationFn: (data) => apiClient.tokens.createWalkIn(data),
    onSuccess: (response) => {
      toast.success('Walk-in token created successfully!')
      reset()
      setSelectedUser(null)
      setSearchQuery('')
      
      // Optionally call next token if this was the first in queue
      // callNext(response.data.token.counterId)
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create walk-in token'
      toast.error(message)
    }
  })

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

  // Search users
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['userSearch', searchQuery],
    queryFn: () => apiClient.users.getAll({ search: searchQuery, limit: 10 }),
    enabled: searchQuery.length > 2
  })

  const onSubmit = async (data) => {
    // If user is selected, include their info
    if (selectedUser) {
      data.userId = selectedUser._id
      // Don't require name/email when user is selected
      delete data.name
      delete data.email
    }

    createWalkInMutation.mutate(data)
  }

  const handleUserSelect = (user) => {
    setSelectedUser(user)
    setValue('userId', user._id)
    setValue('name', user.name)
    setValue('email', user.email)
    setValue('phone', user.phone || '')
    setSearchQuery('')
    setError('name', { type: 'manual', message: '' })
    setError('email', { type: 'manual', message: '' })
  }

  const handleClearUser = () => {
    setSelectedUser(null)
    setValue('userId', '')
    setValue('name', '')
    setValue('email', '')
    setValue('phone', '')
    setSearchQuery('')
  }

  const handleBranchChange = (branchId) => {
    setValue('branchId', branchId)
    setValue('departmentId', '')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Walk-in Token</h1>
        <p className="text-gray-600">Generate tokens for walk-in customers</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Branch Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch *
            </label>
            <select
              {...register('branchId')}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              disabled={branchesLoading}
            >
              <option value="">Select branch</option>
              {branches?.data?.branches?.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
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
              Department *
            </label>
            <select
              {...register('departmentId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              disabled={!watchedBranchId || departmentsLoading}
            >
              <option value="">Select department</option>
              {departments?.data?.departments?.map((department) => (
                <option key={department._id} value={department._id}>
                  {department.name}
                </option>
              ))}
            </select>
            {errors.departmentId && (
              <p className="mt-1 text-sm text-red-600">{errors.departmentId.message}</p>
            )}
          </div>

          {/* User Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Existing User (Optional)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            {/* Search Results */}
            {searchResults?.data?.users?.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-md max-h-48 overflow-y-auto">
                {searchResults.data.users.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => handleUserSelect(user)}
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        {user.phone && (
                          <p className="text-sm text-gray-500">{user.phone}</p>
                        )}
                      </div>
                      <Plus className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected User */}
            {selectedUser && (
              <div className="mt-2 p-3 bg-primary-50 border border-primary-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-primary-900">{selectedUser.name}</p>
                    <p className="text-sm text-primary-700">{selectedUser.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearUser}
                    className="text-primary-600 hover:text-primary-800 text-sm"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Customer Information */}
          {!selectedUser && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter customer name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter phone number"
                />
              </div>
            </>
          )}

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
          </div>

          {/* Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Walk-in Token Information</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Walk-in tokens will be added to the current queue</li>
                  <li>Estimated wait time will be calculated automatically</li>
                  <li>Customer will receive real-time updates</li>
                  <li>QR code will be generated for easy check-in</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={createWalkInMutation.isLoading || !watchedBranchId || !watchedDepartmentId}
              className="w-full btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createWalkInMutation.isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Token...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Users className="h-5 w-5 mr-2" />
                  Create Walk-in Token
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default WalkInToken
