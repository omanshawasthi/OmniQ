import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Filter,
  Download
} from 'lucide-react'
import { analyticsAPI } from '../../utils/api'

const Analytics = () => {
  const [dateRange, setDateRange] = useState('7days')
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')

  // Calculate date range
  const getDateRange = () => {
    const end = endOfDay(new Date())
    let start
    
    switch (dateRange) {
      case 'today':
        start = startOfDay(new Date())
        break
      case '7days':
        start = startOfDay(subDays(end, 7))
        break
      case '30days':
        start = startOfDay(subDays(end, 30))
        break
      case '90days':
        start = startOfDay(subDays(end, 90))
        break
      default:
        start = startOfDay(subDays(end, 7))
    }
    
    return { start, end }
  }

  const { start, end } = getDateRange()

  // Get dashboard analytics
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['analytics', 'dashboard', selectedBranch, selectedDepartment, dateRange],
    queryFn: () => apiClient.analytics.getDashboard({
      branchId: selectedBranch,
      departmentId: selectedDepartment,
      startDate: start,
      endDate: end
    })
  })

  // Get token statistics
  const { data: tokenStats, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics', 'tokens', selectedBranch, selectedDepartment, dateRange],
    queryFn: () => apiClient.analytics.getTokenStats({
      branchId: selectedBranch,
      departmentId: selectedDepartment,
      startDate: start,
      endDate: end
    })
  })

  // Get branches for filter
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => apiClient.branches.getAll()
  })

  // Get departments when branch is selected
  const { data: departments } = useQuery({
    queryKey: ['departments', selectedBranch],
    queryFn: () => apiClient.departments.getAll(selectedBranch),
    enabled: !!selectedBranch
  })

  // Chart data preparation
  const prepareChartData = () => {
    if (!dashboardData?.data) return []

    const data = dashboardData.data
    
    return [
      {
        name: 'Total Tokens',
        value: data.totalTokens || 0,
        change: data.tokensChange || 0,
        icon: Users,
        color: '#3b82f6'
      },
      {
        name: 'Completed',
        value: data.completedTokens || 0,
        change: data.completionChange || 0,
        icon: CheckCircle,
        color: '#22c55e'
      },
      {
        name: 'Avg Wait Time',
        value: Math.round(data.averageWaitTime || 0),
        unit: 'min',
        change: data.waitTimeChange || 0,
        icon: Clock,
        color: '#f59e0b'
      },
      {
        name: 'Completion Rate',
        value: Math.round(data.completionRate || 0),
        unit: '%',
        change: data.completionRateChange || 0,
        icon: TrendingUp,
        color: '#8b5cf6'
      }
    ]
  }

  const prepareHourlyData = () => {
    if (!tokenStats?.data?.hourlyStats) return []

    return tokenStats.data.hourlyStats.map(item => ({
      hour: item.hour,
      tokens: item.count,
      completed: item.completed || 0,
      avgWaitTime: item.avgWaitTime || 0
    }))
  }

  const prepareDepartmentData = () => {
    if (!tokenStats?.data?.departmentStats) return []

    return Object.entries(tokenStats.data.departmentStats).map(([name, stats]) => ({
      name,
      tokens: stats.total || 0,
      completed: stats.completed || 0,
      avgWaitTime: stats.avgWaitTime || 0,
      completionRate: stats.completionRate || 0
    }))
  }

  const prepareBookingTypeData = () => {
    if (!tokenStats?.data?.bookingTypeStats) return []

    const data = tokenStats.data.bookingTypeStats
    return [
      { name: 'Online Booking', value: data.online || 0, color: '#3b82f6' },
      { name: 'Walk-in', value: data.walkin || 0, color: '#22c55e' }
    ]
  }

  const chartData = prepareChartData()
  const hourlyData = prepareHourlyData()
  const departmentData = prepareDepartmentData()
  const bookingTypeData = prepareBookingTypeData()

  const exportData = () => {
    // Create CSV content
    const csvContent = [
      ['Metric', 'Value', 'Change'],
      ...chartData.map(item => [
        item.name,
        item.value + (item.unit || ''),
        item.change + '%'
      ])
    ].map(row => row.join(','))

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Comprehensive queue performance metrics</p>
          </div>
          <button
            onClick={exportData}
            className="btn-outline btn-md flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Branches</option>
              {branches?.data?.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              disabled={!selectedBranch}
            >
              <option value="">All Departments</option>
              {departments?.data?.map((department) => (
                <option key={department._id} value={department._id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setDateRange('7days')
                setSelectedBranch('')
                setSelectedDepartment('')
              }}
              className="btn-outline btn-md"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {chartData.map((item, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <item.icon 
                  className="h-8 w-8 mr-3" 
                  style={{ color: item.color }}
                />
                <div>
                  <p className="text-sm text-gray-600">{item.name}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {item.value}
                    {item.unit && <span className="text-lg text-gray-600 ml-1">{item.unit}</span>}
                  </p>
                </div>
              </div>
              <div className={`flex items-center text-sm ${
                item.change > 0 ? 'text-green-600' : item.change < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                <TrendingUp className="h-4 w-4 mr-1" />
                {item.change > 0 ? '+' : ''}{item.change}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Hourly Tokens Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hourly Token Volume</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="tokens" fill="#3b82f6" />
              <Bar dataKey="completed" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department Performance */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="tokens" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Booking Type Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Type Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={bookingTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {bookingTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm font-medium">Completion Rate</span>
              </div>
              <span className="text-lg font-semibold">
                {dashboardData?.data?.completionRate || 0}%
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-sm font-medium">Avg Service Time</span>
              </div>
              <span className="text-lg font-semibold">
                {Math.round(dashboardData?.data?.averageServiceTime || 0)} min
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-sm font-medium">No-show Rate</span>
              </div>
              <span className="text-lg font-semibold">
                {Math.round(dashboardData?.data?.noShowRate || 0)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
