import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  User as UserIcon, 
  Users, 
  RefreshCcw, 
  AlertCircle,
  CheckCircle2,
  Play,
  PauseCircle,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { io } from 'socket.io-client';
import { tokenAPI } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { SOCKET_EVENTS, ROOM_TYPES, TOKEN_STATUS } from '../../utils/constants';
import toast from 'react-hot-toast';

const LiveQueuePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token: authToken } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef(null);
  const refreshTimerRef = useRef(null);

  const fetchLiveStatus = useCallback(async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      const response = await tokenAPI.getTokenLiveStatus(id);
      setData(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching live status:', err);
      setError(err.response?.data?.message || 'Failed to fetch live queue status');
      if (err.response?.status === 404 || err.response?.status === 401) {
        toast.error(err.response?.data?.message || 'Unauthorized or Token not found');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLiveStatus();

    // Setup Socket.IO
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
    const socket = io(socketUrl, {
      auth: { token: authToken },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to queue server');
      setIsConnected(true);
      
      // Join rooms for live updates
      if (data?.token?.branchId) {
        socket.emit(SOCKET_EVENTS.JOIN_ROOM, { room: ROOM_TYPES.BRANCH + data.token.branchId });
      }
      if (user?._id) {
        socket.emit(SOCKET_EVENTS.JOIN_ROOM, { room: ROOM_TYPES.USER + user._id });
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from queue server');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setIsConnected(false);
    });

    // Handle real-time updates
    const handleUpdate = (updatedData) => {
      console.log('Received live update:', updatedData);
      fetchLiveStatus(); // Refetch authoritative state from backend
    };

    socket.on(SOCKET_EVENTS.QUEUE_UPDATED, handleUpdate);
    socket.on(SOCKET_EVENTS.TOKEN_STATUS_CHANGED, (payload) => {
      // If it's our token, show a toast
      if (payload.token?._id === id || payload.tokenId === id) {
        toast.success(`Token Status Update: ${payload.action || payload.status}`);
        fetchLiveStatus();
      }
    });

    socket.on(SOCKET_EVENTS.TOKEN_CALLED, (payload) => {
      if (payload.token?._id === id || payload.tokenId === id) {
        toast.success('🎉 Your token is being called! Please proceed to the counter.');
        fetchLiveStatus();
      }
    });

    // Fallback Polling (Every 60s)
    refreshTimerRef.current = setInterval(() => {
      fetchLiveStatus();
    }, 60000);

    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [id, fetchLiveStatus, authToken, user?._id, data?.token?.branchId]);

  // Re-join room if data loads later
  useEffect(() => {
    if (isConnected && socketRef.current && data?.token?.branchId) {
      socketRef.current.emit(SOCKET_EVENTS.JOIN_ROOM, { room: ROOM_TYPES.BRANCH + data.token.branchId });
    }
  }, [isConnected, data?.token?.branchId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCcw className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Connecting to live queue...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-red-100">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={() => fetchLiveStatus()}
              className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
            <Link 
              to="/dashboard"
              className="block w-full text-indigo-600 font-medium hover:text-indigo-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { token, position, peopleAhead, currentlyServing, queueStatus, estimatedWaitTime } = data;
  const isWaiting = token.status === TOKEN_STATUS.WAITING;
  const isServing = token.status === TOKEN_STATUS.SERVING;

  const getStatusColor = (status) => {
    switch (status) {
      case TOKEN_STATUS.WAITING: return 'text-amber-600 bg-amber-50 border-amber-200';
      case TOKEN_STATUS.SERVING: return 'text-green-600 bg-green-50 border-green-200';
      case TOKEN_STATUS.COMPLETED: return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getQueueStatusIcon = (status) => {
    if (status === 'paused') return <PauseCircle className="w-5 h-5 text-amber-500" />;
    if (status === 'closed') return <XCircle className="w-5 h-5 text-red-500" />;
    return <Play className="w-5 h-5 text-green-500 animate-pulse" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Live Tracking</h1>
          <button 
            onClick={() => fetchLiveStatus(true)}
            disabled={isRefreshing}
            className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCcw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6">
        {/* Connection Status Badge */}
        <div className="flex justify-center mb-6">
          <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
            isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
            {isConnected ? 'Live Connected' : 'Reconnecting...'}
          </div>
        </div>

        {/* Token Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 mb-6">
          {/* Main Display */}
          <div className="p-8 text-center bg-gradient-to-br from-indigo-600 to-violet-700 text-white relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/20 rounded-full -ml-12 -mb-12 blur-xl" />

            <div className="relative z-10">
              <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest mb-2">Your Token Number</p>
              <h2 className="text-7xl font-black mb-4 drop-shadow-md">{token.tokenNumber}</h2>
              <div className="flex justify-center">
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 ${
                  isServing ? 'bg-white text-green-600 border-white' : 'bg-white/20 text-white border-white/30'
                }`}>
                  {isServing ? 'NOW SERVING' : token.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm transition-transform hover:scale-[1.02]">
                <p className="text-gray-500 text-xs font-bold uppercase mb-1">Position</p>
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" />
                  <span className="text-2xl font-black text-gray-900">{isWaiting ? `#${position}` : '--'}</span>
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm transition-transform hover:scale-[1.02]">
                <p className="text-gray-500 text-xs font-bold uppercase mb-1">Wait Time</p>
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <span className="text-2xl font-black text-gray-900">{isWaiting ? `${estimatedWaitTime}m` : '--'}</span>
                </div>
              </div>
            </div>

            {/* Progress Visualizer */}
            <div className="mb-8 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4 text-indigo-500" />
                  Live Progress
                </h3>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  {getQueueStatusIcon(queueStatus)}
                  <span className="capitalize">{queueStatus}</span>
                </div>
              </div>

              {isWaiting ? (
                <>
                  <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden mb-3">
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-1000 ease-in-out shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                      style={{ width: `${Math.max(5, 100 - (peopleAhead * 10))}%` }}
                    />
                  </div>
                  <p className="text-sm text-center font-medium text-gray-600">
                    <span className="text-indigo-600 font-bold">{peopleAhead} person</span> already ahead of you
                  </p>
                </>
              ) : isServing ? (
                <div className="bg-green-100 p-4 rounded-xl text-center border border-green-200 shadow-inner">
                  <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-green-800 font-bold">Please proceed to the counter!</p>
                  <p className="text-green-700 text-sm">Your turn has arrived.</p>
                </div>
              ) : (
                <div className="bg-gray-100 p-4 rounded-xl text-center border border-gray-200">
                  <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-700 font-bold">Tracking suspended</p>
                  <p className="text-gray-600 text-sm">Token status is {token.status}</p>
                </div>
              )}
            </div>

            {/* Serving Infobar */}
            <div className="flex items-center justify-between p-5 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Currently Serving</p>
                  <p className="text-lg font-black text-gray-900">{currentlyServing?.tokenNumber || '---'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Service</p>
                <p className="text-sm font-bold text-gray-700">{token.departmentId?.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-3">
          <Link 
            to={`/user/tokens/${id}`}
            className="flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                <AlertCircle className="w-6 h-6" />
              </div>
              <span className="font-bold text-gray-700 group-hover:text-gray-900">View Token Details</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500" />
          </Link>
          <Link 
            to="/user/tokens"
            className="flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <span className="font-bold text-gray-700 group-hover:text-gray-900">My Queue History</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500" />
          </Link>
        </div>
        
        <p className="text-center text-gray-400 text-xs mt-8">
          Queue tracking refreshes automatically. <br/>
          Estimated times are based on average service speed.
        </p>
      </div>
    </div>
  );
};

export default LiveQueuePage;
