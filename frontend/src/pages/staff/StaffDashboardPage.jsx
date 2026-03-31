import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, AlertCircle, CheckCircle, Clock, Copy, Plus, ClipboardList, Loader2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { staffAPI } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

const StaffDashboardPage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await staffAPI.getTodayStats();
      setStats(data);
      setError('');
    } catch (err) {
      console.error('Failed to load stats:', err);
      setError('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">Staff Dashboard</h1>
            <nav className="flex items-center space-x-6">
              <span className="text-gray-900 font-medium">Dashboard</span>
              <Link to="/staff/queue" className="text-gray-500 hover:text-blue-600 font-medium transition-colors">Today's Queue</Link>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-500 hover:text-red-600 font-medium transition-colors border-l pl-6"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Welcome, {user?.name || 'Staff Member'} 👋</h2>
          <p className="text-gray-600 mt-1">Here is the operational summary for today's queue.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <ClipboardList className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Total Today</p>
            </div>
            <p className="text-4xl font-extrabold text-gray-900 ml-1">{stats?.total || 0}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Waiting</p>
            </div>
            <p className="text-4xl font-extrabold text-gray-900 ml-1">{stats?.waiting || 0}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg text-green-600">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Serving</p>
            </div>
            <p className="text-4xl font-extrabold text-gray-900 ml-1">{stats?.serving || 0}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Completed</p>
            </div>
            <p className="text-4xl font-extrabold text-gray-900 ml-1">{stats?.completed || 0}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="border-b px-6 py-4 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Current Distribution</h3>
            </div>
            <div className="p-6 space-y-4">
               <div className="flex justify-between border-b pb-2">
                 <span className="text-gray-600">Online Bookings</span>
                 <span className="font-semibold text-gray-900">{stats?.online || 0}</span>
               </div>
               <div className="flex justify-between border-b pb-2">
                 <span className="text-gray-600">Walk-ins</span>
                 <span className="font-semibold text-gray-900">{stats?.walkIn || 0}</span>
               </div>
               <div className="flex justify-between border-b pb-2">
                 <span className="text-gray-600">Missed / No Shows</span>
                 <span className="font-semibold text-gray-900">{stats?.missed || 0}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-600">Skipped</span>
                 <span className="font-semibold text-gray-900">{stats?.skipped || 0}</span>
               </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-sm p-8 text-white flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10">
               <Users className="w-48 h-48 -mr-10 -mt-10" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Manage Queue Safely</h3>
            <p className="text-blue-100 mb-8 max-w-sm">From the queue operational view, you can see all tokens arranged by priority and status.</p>
            <div>
              <Link to="/staff/queue" className="inline-flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-lg font-bold shadow-md hover:bg-gray-50 transition-colors">
                <ClipboardList className="w-5 h-5" />
                Open Today's Queue
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffDashboardPage;
