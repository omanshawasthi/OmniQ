import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, AlertCircle, CheckCircle, Clock, Plus, ClipboardList, Loader2, LogOut, UserPlus, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { staffAPI } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

const StaffDashboardPage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, teamData] = await Promise.all([
        staffAPI.getTodayStats(),
        staffAPI.getTeam()
      ]);
      setStats(statsData);
      setTeam(teamData || []);
      setError('');
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stats Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="border-b px-6 py-4 bg-gray-50 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-gray-500" />
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

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-sm p-8 text-white flex flex-col justify-center relative overflow-hidden lg:col-span-1">
            <div className="absolute top-0 right-0 opacity-10">
               <Users className="w-48 h-48 -mr-10 -mt-10" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-white">Manage Queue</h3>
            <p className="text-blue-100 mb-6 max-w-sm">View all tokens, or add a walk-in visitor directly to the live queue.</p>
            <div className="flex flex-col gap-3">
              <Link to="/staff/queue" className="inline-flex items-center gap-2 bg-white text-blue-700 px-5 py-2.5 rounded-lg font-bold shadow-md hover:bg-gray-50 transition-colors">
                <ClipboardList className="w-5 h-5" />
                Today's Queue
              </Link>
              <Link to="/staff/walk-in" className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-colors">
                <UserPlus className="w-5 h-5" />
                Add Walk-in
              </Link>
              <Link to="/staff/queue?dateRange=30days" className="inline-flex items-center gap-2 bg-blue-100/10 hover:bg-blue-100/20 text-white border border-blue-400/30 px-5 py-2 rounded-lg font-semibold text-sm transition-colors justify-center">
                <RotateCcw className="w-4 h-4" />
                Historical History
              </Link>
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="border-b px-6 py-4 bg-gray-50 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-bold text-gray-900">Branch Team</h3>
            </div>
            <div className="p-0 max-h-[290px] overflow-y-auto">
              <ul className="divide-y divide-gray-100">
                {team.length === 0 ? (
                  <li className="px-6 py-8 text-center text-gray-400 italic">No other staff members found.</li>
                ) : (
                  team.map(member => (
                    <li key={member._id || member.email} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                          {member.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500 font-medium lowercase italic">{member.email}</p>
                        </div>
                        {member.email === user?.email && (
                          <span className="ml-auto text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-black uppercase">You</span>
                        )}
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t text-xs text-gray-500 text-center">
              Team members assigned to your hospital
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffDashboardPage;
