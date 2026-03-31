import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertCircle, Clock, CheckCircle, Activity, SkipForward, XCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { staffAPI } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

const StaffQueuePage = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const data = await staffAPI.getTodayQueue();
      setTokens(data || []);
      setError('');
    } catch (err) {
      console.error('Failed to load queue:', err);
      setError('Failed to load today\'s operational queue.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    const map = {
      waiting: 'bg-blue-100 text-blue-800',
      serving: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-800',
      held: 'bg-yellow-100 text-yellow-800',
      missed: 'bg-gray-100 text-gray-500',
      skipped: 'bg-gray-100 text-gray-500',
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-bold rounded-md uppercase tracking-wider ${map[s] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const p = (priority || '').toLowerCase();
    if (p === 'urgent') return <span className="bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase ml-2">Urgent</span>;
    if (p === 'high') return <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase ml-2">High</span>;
    return null;
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link to="/staff" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Today's Queue</h1>
            </div>
            <div className="flex items-center gap-6">
              <button 
                onClick={loadQueue}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-500 hover:text-red-600 font-medium transition-colors border-l pl-6"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Operational View</h2>
            <p className="text-sm text-gray-500 mt-1">Tokens organized by status and priority</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500 font-medium">Fetching today's queue...</p>
          </div>
        ) : tokens.length === 0 ? (
          <div className="bg-white py-20 rounded-xl border border-dashed border-gray-300 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Queue is Empty</h3>
            <p className="text-gray-500">There are no tokens assigned for today.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/4">Token & Client</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Service Details</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Schedule & Source</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tokens.map((token) => (
                    <tr key={token._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <span className="text-lg font-black text-gray-900">{token.tokenNumber}</span>
                            {getPriorityBadge(token.priority)}
                          </div>
                          <span className="text-sm text-gray-600 font-medium mt-1">
                            {token.userId?.name || token.metadata?.walkInName || 'Walk-in Guest'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-800">{token.departmentId?.name || 'Unknown Service'}</span>
                          <span className="text-xs text-gray-500">{token.branchId?.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 flex items-center gap-1.5 mb-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {formatTime(token.scheduledTime)}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">{token.bookingType === 'online' ? 'Online' : 'Walk-in'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(token.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StaffQueuePage;
