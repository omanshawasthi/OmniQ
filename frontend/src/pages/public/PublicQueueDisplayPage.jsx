import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { 
  Building, 
  MapPin, 
  Clock, 
  Users, 
  LayoutDashboard, 
  AlertCircle,
  TrendingUp,
  Monitor
} from 'lucide-react';
import { apiClient } from '../../services/api';
import { format } from 'date-fns';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const PublicQueueDisplayPage = () => {
  const { branchId, departmentId } = useParams();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [flashNowServing, setFlashNowServing] = useState(false);
  const audioRef = useRef(null);

  // Fetch Public Queue Data
  const { data: displayData, isLoading, isError, refetch } = useQuery({
    queryKey: ['publicDisplay', branchId, departmentId],
    queryFn: async () => {
      const response = await apiClient.public.getDisplayData(branchId, departmentId);
      return response.data.data;
    },
    refetchInterval: 30000, // Fallback polling every 30 seconds
  });

  // Clock Update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Socket.IO Integration
  useEffect(() => {
    const socket = io(SOCKET_URL);
    const room = departmentId ? `${branchId}-${departmentId}` : branchId;

    socket.on('connect', () => {
      console.log('Connected to socket', socket.id);
      socket.emit('join-queue', { branchId, departmentId });
    });

    socket.on('queue_updated', (data) => {
      console.log('Queue updated!', data);
      refetch();
      // Visual feedback
      setFlashNowServing(true);
      setTimeout(() => setFlashNowServing(false), 2000);
      
      // Optional: Sound effect (disabled by default due to browser policies)
      // audioRef.current?.play().catch(e => console.log('Audio play failed', e));
    });

    return () => {
      socket.emit('leave-queue', { branchId, departmentId });
      socket.disconnect();
    };
  }, [branchId, departmentId, refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xl font-bold tracking-widest uppercase">Initializing Display...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-center p-8">
        <div className="max-w-md space-y-6">
          <AlertCircle className="h-20 w-20 text-red-500 mx-auto" />
          <h1 className="text-3xl font-black uppercase tracking-tight">Display Connection Failed</h1>
          <p className="text-gray-400 text-lg">Unable to connect to the queue system. Please verify the branch and department IDs.</p>
          <button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-bold transition-all active:scale-95">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { branch, department, serving, upNext } = displayData;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans selection:bg-blue-500 overflow-hidden">
      {/* Top Banner */}
      <header className="bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between shadow-2xl relative z-10">
        <div className="flex items-center gap-6">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20">
            <LayoutDashboard className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight uppercase leading-none">Queue Display</h1>
            <div className="flex items-center gap-4 mt-2 text-gray-400 font-bold text-lg">
              <span className="flex items-center gap-2 decoration-blue-500 decoration-2 underline-offset-4 underline">{branch.name}</span>
              <span className="opacity-30">|</span>
              <span className="text-blue-400 uppercase tracking-widest">{department.name}</span>
            </div>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="text-5xl font-black tabular-nums tracking-tighter text-blue-50 font-mono">
            {format(currentTime, 'HH:mm:ss')}
          </div>
          <p className="text-gray-500 font-bold uppercase tracking-widest mt-1">
            {format(currentTime, 'eeee, dd MMMM yyyy').toUpperCase()}
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:flex-row gap-1 p-1">
        {/* Left Side: Now Serving */}
        <section className={`flex-[2] bg-gray-900 relative flex flex-col items-center justify-center transition-all duration-700 ${flashNowServing ? 'bg-blue-900/40' : ''}`}>
          <div className="absolute top-12 left-12 flex items-center gap-3 bg-red-600 px-6 py-2 rounded-full shadow-lg animate-pulse">
            <div className="h-4 w-4 bg-white rounded-full animate-ping"></div>
            <span className="font-black tracking-widest text-lg uppercase">Now Serving</span>
          </div>

          {!serving ? (
            <div className="text-center space-y-6">
              <Users className="h-32 w-32 text-gray-800 mx-auto" />
              <h2 className="text-5xl font-black text-gray-600 uppercase tracking-tighter">Waiting for Next Token</h2>
              <p className="text-gray-500 text-2xl font-medium max-w-lg mx-auto">Please have your token number ready. Staff will call the next person shortly.</p>
            </div>
          ) : (
            <div className={`text-center space-y-4 transition-transform duration-500 ${flashNowServing ? 'scale-110' : 'scale-100'}`}>
              <div className="space-y-2">
                <p className="text-blue-400 font-bold text-3xl uppercase tracking-[0.3em] mb-4">Token Number</p>
                <div className="relative">
                  <h2 className="text-[20rem] font-black leading-none tracking-tighter text-white drop-shadow-[0_20px_20px_rgba(59,130,246,0.3)] font-mono">
                    {serving.tokenNumber}
                  </h2>
                </div>
              </div>
              
              <div className="inline-flex items-center gap-4 bg-gray-800 border-2 border-gray-700 px-12 py-6 rounded-[2rem] shadow-2xl">
                <Monitor className="h-12 w-12 text-blue-400" />
                <span className="text-5xl font-black text-white uppercase tracking-tight">Proceed to {serving.counter}</span>
              </div>
            </div>
          )}

          {/* Decorative background number if serving */}
          {serving && (
            <div className="absolute -bottom-20 -right-20 text-[30rem] font-black text-white/[0.02] pointer-events-none select-none">
              {serving.tokenNumber}
            </div>
          )}
        </section>

        {/* Right Side: Up Next */}
        <section className="flex-1 bg-gray-900 p-8 flex flex-col border-l border-gray-800">
          <div className="bg-gray-800/50 p-6 rounded-3xl mb-8 flex items-center justify-between border border-gray-700">
            <h3 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
              <TrendingUp className="text-blue-500 h-8 w-8" /> Up Next
            </h3>
            <span className="bg-gray-700 px-4 py-1 rounded-full text-sm font-bold text-gray-400 uppercase tracking-widest border border-gray-600">
              {upNext.length} Tokens
            </span>
          </div>

          <div className="flex-1 space-y-4">
            {upNext.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 italic space-y-4">
               <AlertCircle className="h-16 w-16" />
               <p className="text-2xl font-bold lowercase tracking-tight">The queue is currently empty.</p>
              </div>
            ) : (
              upNext.map((token, idx) => (
                <div 
                  key={token.tokenNumber} 
                  className="bg-gray-800/40 hover:bg-gray-800 p-6 rounded-3xl border border-gray-800 flex items-center justify-between group transition-all"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-center gap-6">
                    <span className="text-xl font-bold text-gray-600 w-8">{idx + 1}</span>
                    <span className="text-5xl font-black font-mono tracking-tighter group-hover:text-blue-400 transition-colors">
                      {token.tokenNumber}
                    </span>
                  </div>
                  {token.priority === 'high' && (
                    <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-4 py-1 rounded-full text-sm font-black uppercase tracking-widest">
                      Priority
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Bottom Footer Info */}
          <div className="mt-8 pt-8 border-t border-gray-800 space-y-4 text-gray-500 font-bold">
             <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-blue-600" />
                <p className="text-lg">Please proceed to your assigned counter when your number appears.</p>
             </div>
             <p className="text-sm opacity-50 uppercase tracking-[0.2em]">QueueLess Platform • Live Refresh Active</p>
          </div>
        </section>
      </main>

      {/* Optional Audio Element */}
      <audio ref={audioRef} src="/assets/chime.mp3" preload="auto" />
    </div>
  );
};

export default PublicQueueDisplayPage;
