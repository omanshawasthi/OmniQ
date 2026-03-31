import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Users, Search, Edit, UserCheck, UserX,
  ShieldCheck, Loader2, ChevronDown
} from 'lucide-react'

const ROLES = ['USER', 'STAFF', 'ADMIN']

const roleBadgeClass = (role) => {
  const r = role?.toUpperCase()
  if (r === 'ADMIN') return 'bg-purple-100 text-purple-800'
  if (r === 'STAFF') return 'bg-blue-100 text-blue-800'
  return 'bg-gray-100 text-gray-700'
}

const UsersPage = () => {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuthStore()

  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Modals
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [newRole, setNewRole] = useState('')
  const [assignedBranch, setAssignedBranch] = useState('')

  // Fetch users
  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter, statusFilter],
    queryFn: async () => {
      const params = {}
      if (search) params.search = search
      if (roleFilter) params.role = roleFilter.toLowerCase()
      if (statusFilter !== '') params.isActive = statusFilter
      const res = await apiClient.users.getAll(params)
      return res.data
    },
    keepPreviousData: true
  })
  const users = response?.data?.users || response?.data || []

  // Fetch branches for role modal (STAFF needs a branch)
  const { data: branchResponse } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await apiClient.branches.getAll()
      return res.data
    }
  })
  const branches = branchResponse?.data || []

  // Mutations
  const activateMutation = useMutation({
    mutationFn: (id) => apiClient.users.activate(id),
    onSuccess: () => { toast.success('Account activated'); queryClient.invalidateQueries(['admin-users']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to activate')
  })

  const deactivateMutation = useMutation({
    mutationFn: (id) => apiClient.users.deactivate(id),
    onSuccess: () => { toast.success('Account deactivated'); queryClient.invalidateQueries(['admin-users']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to deactivate')
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, roleData }) => apiClient.users.updateRole(id, roleData),
    onSuccess: () => {
      toast.success('Role updated successfully')
      queryClient.invalidateQueries(['admin-users'])
      setIsRoleModalOpen(false)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update role')
  })

  // Handlers
  const handleToggleStatus = (user) => {
    if (user._id === currentUser?._id) {
      return toast.error('You cannot deactivate your own account')
    }
    if (user.isActive) {
      if (window.confirm(`Deactivate ${user.name}? They will be blocked from logging in.`)) {
        deactivateMutation.mutate(user._id)
      }
    } else {
      activateMutation.mutate(user._id)
    }
  }

  const handleOpenRoleModal = (user) => {
    if (user._id === currentUser?._id) {
      return toast.error('You cannot change your own role')
    }
    setEditingUser(user)
    setNewRole(user.role?.toUpperCase() || 'USER')
    setAssignedBranch(user.assignedBranch?._id || user.assignedBranch || '')
    setIsRoleModalOpen(true)
  }

  const handleRoleSave = () => {
    if (!newRole) return toast.error('Select a valid role')
    if (newRole === 'STAFF' && !assignedBranch) {
      return toast.error('Staff users must be assigned to a branch')
    }
    updateRoleMutation.mutate({
      id: editingUser._id,
      roleData: {
        role: newRole.toLowerCase(),
        assignedBranch: newRole === 'STAFF' ? assignedBranch : null,
        assignedCounter: null
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/admin" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Manage Users & Roles</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>

          <div className="text-sm text-gray-500 ml-auto">
            {users.length} user{users.length !== 1 ? 's' : ''} found
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden border">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              <p className="mt-2 text-gray-500 text-sm">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="font-medium">No users found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => {
                    const isSelf = user._id === currentUser?._id
                    return (
                      <tr key={user._id} className={`hover:bg-gray-50 ${!user.isActive ? 'opacity-60' : ''}`}>
                        {/* User info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                {user.name}
                                {isSelf && <span className="text-xs text-gray-400">(you)</span>}
                              </div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                              {user.phone && <div className="text-xs text-gray-400">{user.phone}</div>}
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${roleBadgeClass(user.role)}`}>
                            {user.role?.toUpperCase()}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        {/* Assignment info */}
                        <td className="px-6 py-4">
                          {user.assignedBranch ? (
                            <div className="text-xs text-gray-700">
                              <div className="font-medium">{user.assignedBranch?.name || 'Branch assigned'}</div>
                              {user.assignedCounter && (
                                <div className="text-gray-500 mt-0.5">Counter: {user.assignedCounter?.name}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Change Role */}
                            <button
                              onClick={() => handleOpenRoleModal(user)}
                              disabled={isSelf}
                              title="Change role"
                              className="p-1.5 rounded text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </button>

                            {/* Toggle Active/Inactive */}
                            <button
                              onClick={() => handleToggleStatus(user)}
                              disabled={isSelf || activateMutation.isPending || deactivateMutation.isPending}
                              title={user.isActive ? 'Deactivate account' : 'Activate account'}
                              className={`p-1.5 rounded disabled:opacity-30 disabled:cursor-not-allowed ${user.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                            >
                              {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Role Change Modal */}
      {isRoleModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setIsRoleModalOpen(false)}></div>
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md z-10">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-5 w-5 text-indigo-500" />
                  Update Role
                </h3>
                <p className="text-sm text-gray-500 mb-5 pb-4 border-b">
                  Changing role for <strong>{editingUser.name}</strong> ({editingUser.email})
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Role</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  {/* Show branch selector only for STAFF */}
                  {newRole === 'STAFF' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Branch *</label>
                      <select
                        value={assignedBranch}
                        onChange={(e) => setAssignedBranch(e.target.value)}
                        className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select branch...</option>
                        {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Role description hints */}
                  <div className="bg-gray-50 rounded-md p-3 text-xs text-gray-500">
                    {newRole === 'USER' && 'Regular users can book tokens and view queue status.'}
                    {newRole === 'STAFF' && 'Staff can manage queues, create walk-in tokens, and serve customers. Requires a branch assignment.'}
                    {newRole === 'ADMIN' && '⚠️ Admins have full system access. Grant this role carefully.'}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                <button
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRoleSave}
                  disabled={updateRoleMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
                >
                  {updateRoleMutation.isPending ? 'Saving...' : 'Save Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersPage
