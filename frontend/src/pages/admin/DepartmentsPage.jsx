import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { ArrowLeft, Edit, Trash2, Plus, Loader2, Layers, LogOut, Monitor } from 'lucide-react'

// Default empty department structure
const initialFormState = {
  name: '',
  description: '',
  averageServiceTime: 15,
  isActive: true,
  prioritySupport: false
}

const DepartmentsPage = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(initialFormState)

  const handleSignOut = () => {
    logout()
    navigate('/login')
  }

  // Fetch all branches for dropdown
  const { data: branchesResponse, isLoading: isLoadingBranches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await apiClient.branches.getAll()
      return res.data
    }
  })

  const branches = branchesResponse?.data?.branches || branchesResponse?.data || []

  // Default to first branch if none selected and branches exist
  React.useEffect(() => {
    if (!selectedBranchId && branches.length > 0) {
      setSelectedBranchId(branches[0]._id)
    }
  }, [branches, selectedBranchId])

  // Fetch departments for selected branch
  const { data: departmentsResponse, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ['departments', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return { data: [] }
      const res = await apiClient.departments.getAll(selectedBranchId)
      return res.data
    },
    enabled: !!selectedBranchId
  })

  // Notice backend returns { success: true, data: { departments: [...] } } based on our controller update
  const departments = departmentsResponse?.data?.departments || departmentsResponse?.data || [] 

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => apiClient.departments.create({ ...data, branchId: selectedBranchId }),
    onSuccess: () => {
      toast.success('Department created successfully')
      queryClient.invalidateQueries(['departments', selectedBranchId])
      closeModal()
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create department')
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.departments.update(id, data),
    onSuccess: () => {
      toast.success('Department updated successfully')
      queryClient.invalidateQueries(['departments', selectedBranchId])
      closeModal()
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update department')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.departments.delete(id),
    onSuccess: () => {
      toast.success('Department deleted successfully')
      queryClient.invalidateQueries(['departments', selectedBranchId])
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Cannot delete department. Reassign/delete counters first.')
    }
  })

  // Handlers
  const handleOpenModal = (dept = null) => {
    if (dept) {
      setEditingId(dept._id)
      setFormData({
        name: dept.name,
        description: dept.description || '',
        averageServiceTime: dept.averageServiceTime || 15,
        isActive: dept.isActive,
        prioritySupport: dept.prioritySupport || false
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
    setFormData(initialFormState)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedBranchId) {
      toast.error('Must select a branch first')
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/admin/branches" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Branches
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Manage Departments</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Branch Context Selector */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-sm font-medium text-gray-700">Select Branch Context:</h2>
            {isLoadingBranches ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            ) : (
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 min-w-[250px]"
                >
                  <option value="" disabled>Select a branch</option>
                  {branches.map(b => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
            )}
          </div>
          <button
            onClick={() => handleOpenModal()}
            disabled={!selectedBranchId}
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </button>
        </div>

        {/* Departments Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden border">
          {!selectedBranchId ? (
             <div className="p-8 text-center text-gray-500">
             <Layers className="w-12 h-12 mx-auto text-gray-300 mb-3" />
             <p>Please select a branch to view its departments.</p>
           </div>
          ) : isLoadingDepartments ? (
            <div className="p-8 flex justify-center flex-col items-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="mt-2 text-gray-500">Loading departments...</p>
            </div>
          ) : departments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Layers className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No departments configured for this branch yet.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Service Time</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {departments.map((dept) => (
                  <tr key={dept._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${dept.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {dept.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        {dept.name}
                        {dept.prioritySupport && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            Priority
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{dept.description || 'No description provided'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       {dept.averageServiceTime} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/display/${selectedBranchId}/${dept._id}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        title="Open Public Display"
                      >
                        <Monitor className="h-4 w-4 inline" />
                      </Link>
                      <button onClick={() => handleOpenModal(dept)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                        <Edit className="h-4 w-4 inline" />
                      </button>
                      <button onClick={() => handleDelete(dept._id)} className="text-red-600 hover:text-red-900">
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

      {/* Add / Edit Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeModal}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white pl-6 pr-6 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {editingId ? 'Edit Department' : 'Add New Department'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Department Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        rows="2"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      ></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Avg. Service Time (minutes) *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          max="180"
                          value={formData.averageServiceTime}
                          onChange={(e) => setFormData({ ...formData, averageServiceTime: Number(e.target.value) })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    <div className="flex items-center mt-4">
                      <input
                        id="prioritySupport"
                        type="checkbox"
                        checked={formData.prioritySupport}
                        onChange={(e) => setFormData({ ...formData, prioritySupport: e.target.checked })}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="prioritySupport" className="ml-2 block text-sm text-gray-900">
                        Priority Support Active (Fast-track capabilities)
                      </label>
                    </div>
                     <div className="flex items-center mt-4">
                      <input
                        id="isActive"
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                        Department is active and operational
                      </label>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:bg-blue-300"
                  >
                   {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : 'Save Department'}
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
    </div>
  )
}

export default DepartmentsPage
