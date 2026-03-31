import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Edit, Trash2, Plus, Loader2, Monitor, UserPlus, UserMinus } from 'lucide-react'

// Default empty counter structure
const initialFormState = {
  name: '',
  status: 'offline', // matches backend COUNTER_STATUS limits
}

const CountersPage = () => {
  const queryClient = useQueryClient()
  
  // Context states
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('')
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(initialFormState)

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [assigningCounter, setAssigningCounter] = useState(null)
  const [selectedStaffId, setSelectedStaffId] = useState('')

  // Data fetching: Branches
  const { data: branchesResponse, isLoading: isLoadingBranches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await apiClient.branches.getAll()
      return res.data
    }
  })
  const branches = branchesResponse?.data || []

  // Auto-select first branch
  useEffect(() => {
    if (!selectedBranchId && branches.length > 0) {
      setSelectedBranchId(branches[0]._id)
    }
  }, [branches, selectedBranchId])

  // Data fetching: Departments (based on selectedBranch)
  const { data: departmentsResponse, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ['departments', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return { data: [] }
      const res = await apiClient.departments.getAll(selectedBranchId)
      return res.data
    },
    enabled: !!selectedBranchId
  })
  const departments = departmentsResponse?.data?.departments || departmentsResponse?.data || []

  // Reset department selection on branch change
  useEffect(() => {
    if (departments.length > 0 && !departments.some(d => d._id === selectedDepartmentId)) {
      setSelectedDepartmentId(departments[0]._id)
    } else if (departments.length === 0) {
      setSelectedDepartmentId('')
    }
  }, [departments, selectedBranchId, selectedDepartmentId])

  // Data fetching: Counters
  const { data: countersResponse, isLoading: isLoadingCounters } = useQuery({
    queryKey: ['counters', selectedBranchId, selectedDepartmentId],
    queryFn: async () => {
      if (!selectedBranchId || !selectedDepartmentId) return { data: [] }
      const res = await apiClient.counters.getAll(selectedBranchId, selectedDepartmentId)
      return res.data
    },
    enabled: !!(selectedBranchId && selectedDepartmentId)
  })
  const counters = countersResponse?.data?.counters || countersResponse?.data || []

  // Data fetching: Staff members
  const { data: usersResponse, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      // Backend users api supports querying by role, fetching all active users here explicitly
      const res = await apiClient.users.getAll()
      return res.data
    }
  })
  // We extract users matching STAFF or OPERATOR role
  const staffMembers = (usersResponse?.data?.users || []).filter(u => 
     u.role === 'STAFF' || u.role === 'OPERATOR'
  )

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => apiClient.counters.create({ ...data, branchId: selectedBranchId, departmentId: selectedDepartmentId }),
    onSuccess: () => {
      toast.success('Counter created successfully')
      queryClient.invalidateQueries(['counters'])
      closeModal()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create counter')
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.counters.update(id, data),
    onSuccess: () => {
      toast.success('Counter updated successfully')
      queryClient.invalidateQueries(['counters'])
      closeModal()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update counter')
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.counters.delete(id),
    onSuccess: () => {
      toast.success('Counter deleted successfully')
      queryClient.invalidateQueries(['counters'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Cannot delete actively running counter')
  })

  // Notice backend uses api.post(\`/counters/\${id}/assign\`, { userId })
  const assignMutation = useMutation({
    mutationFn: ({ id, userId }) => apiClient.counters.assignOperator(id, userId),
    onSuccess: () => {
       toast.success('Staff assignment updated')
       queryClient.invalidateQueries(['counters']) // refetch counters visually updating staff
       closeAssignModal()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to assign staff')
  })

  // Handlers
  const handleOpenModal = (counter = null) => {
    if (counter) {
      setEditingId(counter._id)
      setFormData({
        name: counter.name,
        status: counter.status || 'offline'
      })
    } else {
      setEditingId(null)
      setFormData(initialFormState)
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedBranchId || !selectedDepartmentId) {
      return toast.error('Select an active Branch and Department first')
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to completely delete this counter?')) {
      deleteMutation.mutate(id)
    }
  }

  // Staff Assignment Handlers
  const handleOpenAssignModal = (counter) => {
    setAssigningCounter(counter)
    setSelectedStaffId(counter.assignedOperator?._id || '')
    setIsAssignModalOpen(true)
  }

  const closeAssignModal = () => {
    setIsAssignModalOpen(false)
    setAssigningCounter(null)
    setSelectedStaffId('')
  }

  const handleAssignSave = () => {
     // if selectedStaffId is empty, we send null implicitly to unassign based on our controller structure
     assignMutation.mutate({ id: assigningCounter._id, userId: selectedStaffId || null })
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
              <h1 className="text-xl font-semibold text-gray-900">Manage Counters & Staff Assignments</h1>
            </div>
            <div className="flex space-x-4">
              <Link to="/admin/departments" className="text-blue-600 hover:text-blue-700 font-medium">
                Switch to Departments &rarr;
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Branch & Dept Context Selectors */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex flex-col md:flex-row gap-4 items-center flex-1">
             <div className="flex items-center space-x-2">
                <h2 className="text-sm font-medium text-gray-700 min-w-[60px]">Branch:</h2>
                {isLoadingBranches ? (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                ) : (
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 min-w-[200px]"
                    >
                      <option value="" disabled>Select a branch</option>
                      {branches.map(b => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))}
                    </select>
                )}
             </div>

             <div className="flex items-center space-x-2">
                <h2 className="text-sm font-medium text-gray-700 min-w-[90px]">Department:</h2>
                {isLoadingDepartments ? (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                ) : (
                    <select
                      value={selectedDepartmentId}
                      onChange={(e) => setSelectedDepartmentId(e.target.value)}
                      disabled={!selectedBranchId}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 min-w-[200px] disabled:bg-gray-200"
                    >
                      <option value="" disabled>Select a department</option>
                      {departments.map(d => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                )}
             </div>
          </div>

          <button
            onClick={() => handleOpenModal()}
            disabled={!selectedDepartmentId}
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Counter
          </button>
        </div>

        {/* Counters Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden border">
          {!selectedDepartmentId ? (
             <div className="p-8 text-center text-gray-500">
             <Monitor className="w-12 h-12 mx-auto text-gray-300 mb-3" />
             <p>Select both a Branch and Department to view associated counters.</p>
           </div>
          ) : isLoadingCounters ? (
            <div className="p-8 flex justify-center flex-col items-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="mt-2 text-gray-500">Loading counters...</p>
            </div>
          ) : counters.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Monitor className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No counters configured for this department yet.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Counter Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Staff</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {counters.map((counter) => (
                  <tr key={counter._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{counter.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${counter.status === 'active' ? 'bg-green-100 text-green-800' : 
                          counter.status === 'paused' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {counter.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       {counter.assignedOperator ? (
                         <div className="flex items-center text-sm font-medium text-indigo-700 cursor-pointer" onClick={() => handleOpenAssignModal(counter)}>
                            {counter.assignedOperator.name} 
                            <span className="text-gray-400 ml-2 font-normal">({counter.assignedOperator.role || 'Staff'})</span>
                            <Edit className="w-3 h-3 ml-2 text-indigo-400 hover:text-indigo-600" />
                         </div>
                       ) : (
                         <button 
                            onClick={() => handleOpenAssignModal(counter)}
                            className="text-xs flex items-center bg-white border border-gray-300 rounded px-2 py-1 text-gray-600 hover:bg-gray-50"
                         >
                           <UserPlus className="w-3 h-3 mr-1" /> Assign Staff
                         </button>
                       )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleOpenModal(counter)} className="text-blue-600 hover:text-blue-900 mr-4">
                        <Edit className="h-4 w-4 inline" />
                      </button>
                      <button onClick={() => handleDelete(counter._id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Add / Edit Counter Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeModal}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white pl-6 pr-6 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {editingId ? 'Edit Counter Identity' : 'Add New Counter'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Counter Label/Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Desk 1"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    {editingId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Operational Status *</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="offline">Offline</option>
                          <option value="active">Active (Serving)</option>
                          <option value="paused">Paused</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:bg-blue-300"
                  >
                   {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : 'Save Configuration'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Staff Modal */}
      {isAssignModalOpen && assigningCounter && (
        <div className="fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeAssignModal}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                <div className="bg-white pl-6 pr-6 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-1 flex items-center">
                     <UserPlus className="w-5 h-5 mr-2 text-indigo-600" /> Allocate Staff Interface 
                  </h3>
                   <p className="text-sm text-gray-500 mb-4 pb-4 border-b">
                     Mapping staff to <strong>{assigningCounter.name}</strong> securely updates active shift statuses globally.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Available Operator</label>
                      {isLoadingStaff ? (
                         <div className="flex items-center text-sm text-gray-500"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading personnel...</div>
                      ) : (
                         <select
                           value={selectedStaffId}
                           onChange={(e) => setSelectedStaffId(e.target.value)}
                           className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-base text-gray-900"
                         >
                           <option value="">-- No Staff Assigned (Unassign) --</option>
                           {staffMembers.map(staff => (
                              <option key={staff._id} value={staff._id}>{staff.name} ({staff.email})</option>
                           ))}
                         </select>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-between">
                  {assigningCounter.assignedOperator && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStaffId('') // trigger unassign implicitly on save or direct
                      }}
                      className="inline-flex justify-center flex-row rounded-md items-center shadow-sm px-4 py-2 text-base font-medium text-red-600 hover:bg-gray-100 focus:outline-none sm:text-sm"
                    >
                      <UserMinus className="w-4 h-4 mr-1"/> Clear Assignment
                    </button>
                  ) || <div></div>}
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={closeAssignModal}
                      className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={assignMutation.isPending}
                      onClick={handleAssignSave}
                      className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:text-sm disabled:bg-indigo-300"
                    >
                      {assignMutation.isPending ? 'Syncing...' : 'Save Mapping'}
                    </button>
                  </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CountersPage
