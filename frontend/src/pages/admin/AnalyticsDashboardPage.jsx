import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, Clock, CheckCircle, 
  AlertCircle, Calendar, Filter, Download, RefreshCcw,
  Building, LayoutDashboard, MousePointer2, Zap, ArrowRight,
  TrendingUp as TrendingUpIcon, Monitor, Footprints
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { apiClient } from '../../services/api';
import toast from 'react-hot-toast';

const AnalyticsDashboardPage = () => {
  const [dateRange, setDateRange] = useState('today');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  // Calculate dates based on range
  const dateParams = React.useMemo(() => {
    const now = new Date();
    const end = endOfDay(now);
    let start;

    switch (dateRange) {
      case 'today':
        start = startOfDay(now);
        break;
      case '7days':
        start = startOfDay(subDays(now, 7));
        break;
      case '30days':
        start = startOfDay(subDays(now, 30));
        break;
      default:
        start = startOfDay(now);
    }

    return { 
      startDate: start.toISOString(), 
      endDate: end.toISOString() 
    };
  }, [dateRange]);

  // Fetch Dashboard Data
  const { data: analyticsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['adminAnalytics', dateParams, selectedBranch, selectedDepartment],
    queryFn: async () => {
      const response = await apiClient.analytics.getDashboard({
        ...dateParams,
        branchId: selectedBranch,
        departmentId: selectedDepartment
      });
      return response.data.data;
    }
  });

  // Fetch Branches
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await apiClient.branches.getAll();
      return response.data.data;
    }
  });

  // Fetch Departments
  const { data: departments } = useQuery({
    queryKey: ['departments', selectedBranch],
    queryFn: async () => {
      const response = await apiClient.departments.getAll(selectedBranch);
      return response.data.data;
    },
    enabled: !!selectedBranch
  });

  const handleExport = () => {
    toast.success('Exporting data... (Phase A6 Feature)');
  };

  if (isError) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-xl border border-red-200">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-red-800">Failed to load analytics</h2>
        <p className="text-red-600 mb-4">There was an error fetching the data. Please try again.</p>
        <button onClick={() => refetch()} className="btn-primary">Try Again</button>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const overview = analyticsData?.overview || {};
  const trends = analyticsData?.trends || [];
  const topDepartments = analyticsData?.topDepartments || [];
  const topBranches = analyticsData?.topBranches || [];
  const walkInVsOnline = analyticsData?.overview?.walkInVsOnline || { walkIn: 0, online: 0 };

  const sourceData = [
    { name: 'Walk-in', value: walkInVsOnline.walkIn },
    { name: 'Online', value: walkInVsOnline.online }
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Real-time operational insights and performance metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => refetch()} 
            className="p-2.5 rounded-lg border bg-white hover:bg-gray-50 transition-colors shadow-sm"
            title="Refresh Data"
          >
            <RefreshCcw className={`h-5 w-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-all shadow-md active:scale-95"
          >
            <Download className="h-5 w-5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-5 rounded-2xl border shadow-sm items-end">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Time Range
          </label>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full h-11 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5" /> Branch
          </label>
          <select 
            value={selectedBranch} 
            onChange={(e) => {
              setSelectedBranch(e.target.value);
              setSelectedDepartment('');
            }}
            className="w-full h-11 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="">All Branches</option>
            {branches?.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <LayoutDashboard className="h-3.5 w-3.5" /> Department
          </label>
          <select 
            value={selectedDepartment} 
            onChange={(e) => setSelectedDepartment(e.target.value)}
            disabled={!selectedBranch}
            className="w-full h-11 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium disabled:opacity-50"
          >
            <option value="">All Departments</option>
            {departments?.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setDateRange('today');
              setSelectedBranch('');
              setSelectedDepartment('');
            }}
            className="h-11 flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICard 
          title="Total Tokens" 
          value={overview.total} 
          icon={<Users className="h-6 w-6" />}
          color="blue"
          loading={isLoading}
        />
        <KPICard 
          title="Completed" 
          value={overview.completed} 
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
          loading={isLoading}
          subValue={`${overview.completionRate}% Rate`}
        />
        <KPICard 
          title="Avg Wait Time" 
          value={overview.avgWaitTime} 
          unit="min"
          icon={<Clock className="h-6 w-6" />}
          color="amber"
          loading={isLoading}
        />
        <KPICard 
          title="Active Serving" 
          value={overview.serving} 
          icon={<Zap className="h-6 w-6" />}
          color="indigo"
          loading={isLoading}
        />
        <KPICard 
          title="No-Shows" 
          value={overview.missed} 
          icon={<AlertCircle className="h-6 w-6" />}
          color="red"
          loading={isLoading}
          subValue={`${overview.noShowRate}% Rate`}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Token Volume Trends */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-gray-900">Token Volume Trends</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full"></span> Total</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-400 rounded-full"></span> Completed</span>
            </div>
          </div>
          <div className="h-[350px] w-full">
            {isLoading ? (
              <div className="w-full h-full bg-gray-50 animate-pulse rounded-xl" />
            ) : trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9ca3af', fontSize: 12}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9ca3af', fontSize: 12}}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="tokens" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorTokens)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No trend data available for this range." />
            )}
          </div>
        </div>

        {/* Source Distribution */}
        <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col">
          <h3 className="text-xl font-bold text-gray-900 mb-8">Booking Channels</h3>
          <div className="flex-1 min-h-[300px]">
            {isLoading ? (
              <div className="w-full h-full bg-gray-50 animate-pulse rounded-xl" />
            ) : overview.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={8} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No booking data." />
            )}
          </div>
          <div className="mt-4 pt-6 border-t space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Monitor className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-semibold text-gray-600">Online/App</span>
              </div>
              <span className="font-bold text-gray-900">{walkInVsOnline.online}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Footprints className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-sm font-semibold text-gray-600">Walk-in</span>
              </div>
              <span className="font-bold text-gray-900">{walkInVsOnline.walkIn}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Rankings Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Dept Rankings */}
        <section className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Department Load</h3>
            <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full uppercase tracking-widest">Rankings</span>
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-xl" />)}
              </div>
            ) : topDepartments.length > 0 ? (
              <div className="space-y-4">
                {topDepartments.map((dept, idx) => (
                  <RankingItem key={dept.name} item={dept} index={idx} total={overview.total} />
                ))}
              </div>
            ) : (
              <EmptyState message="No department rankings available." />
            )}
          </div>
        </section>

        {/* Branch Rankings (Simulated/Filtered) */}
        <section className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Branch Performance</h3>
            <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full uppercase tracking-widest">Rankings</span>
          </div>
          <div className="p-4">
               {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-xl" />)}
              </div>
            ) : topBranches.length > 0 ? (
              <div className="space-y-4">
                {topBranches.map((branch, idx) => (
                  <RankingItem key={branch.name} item={branch} index={idx} total={overview.total} />
                ))}
              </div>
            ) : (
              <EmptyState message="No branch rankings available." />
            )}
          </div>
        </section>
      </div>

      {/* Summary Insights */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Need Deeper Insights?</h2>
          <p className="text-blue-100 opacity-90 max-w-lg">
            Operational patterns suggest that peak traffic occurs around {(trends.sort((a,b) => b.tokens - a.tokens)[0]?.label) || 'busy hours'}. 
            Consider optimizing staff allocation during these periods to maintain your {(overview.completionRate || 0)}% completion rate.
          </p>
        </div>
        <button className="relative z-10 bg-white text-blue-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-50 transition-colors shadow-lg active:scale-95 group">
          Custom Reports
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </button>
        {/* Decorative background shapes */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute left-1/2 top-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl"></div>
      </div>
    </div>
  );
};

/* --- Internal Components --- */

const KPICard = ({ title, value, unit, icon, color, loading, subValue }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    red: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <div className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-3 rounded-xl border ${colorMap[color]}`}>
          {icon}
        </div>
        {loading ? (
          <div className="h-4 w-12 bg-gray-100 animate-pulse rounded-full" />
        ) : (
          <div className="flex items-center text-emerald-500 text-xs font-bold">
            <TrendingUpIcon className="h-3 w-3 mr-1" /> 12%
          </div>
        )}
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        {loading ? (
          <div className="h-8 w-20 bg-gray-100 animate-pulse rounded-lg" />
        ) : (
          <div className="flex items-baseline gap-1">
            <h4 className="text-2xl font-black text-gray-900 leading-none">
              {value || 0}
            </h4>
            {unit && <span className="text-sm font-bold text-gray-400">{unit}</span>}
          </div>
        )}
        {subValue && !loading && (
          <p className="text-xs text-gray-400 mt-2 font-semibold uppercase tracking-tight">{subValue}</p>
        )}
      </div>
    </div>
  );
};

const RankingItem = ({ item, index, total }) => {
  const percentage = total > 0 ? Math.round((item.total / total) * 100) : 0;
  
  return (
    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-sm transition-all group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center text-sm font-black text-blue-600">
            {index + 1}
          </div>
          <span className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{item.name}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tokens</span>
          <span className="font-black text-gray-900">{item.total}</span>
        </div>
      </div>
      <div className="relative h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-1000" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-gray-400">
        <span>{percentage}% of volume</span>
        <span className="text-emerald-500 italic">Avg wait: {item.avgWaitTime}m</span>
      </div>
    </div>
  );
};

const EmptyState = ({ message }) => (
  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 space-y-2 opacity-60 italic">
    <MousePointer2 className="h-10 w-10 stroke-1 mb-2" />
    <p className="text-sm">{message}</p>
  </div>
);

export default AnalyticsDashboardPage;
