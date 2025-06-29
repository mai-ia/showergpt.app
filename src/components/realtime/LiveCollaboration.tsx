import React, { useState, useEffect } from 'react';
import { Users, Plus, Settings, Crown, UserPlus, MessageSquare } from 'lucide-react';
import { useRealtime } from '../../hooks/useRealtime';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface LiveSession {
  id: string;
  name: string;
  description: string;
  host_user_id: string;
  participants: string[];
  active: boolean;
  settings: any;
  created_at: string;
}

export default function LiveCollaboration() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSession, setNewSession] = useState({
    name: '',
    description: '',
    settings: { maxParticipants: 10, isPublic: true }
  });

  // Subscribe to live session updates
  useRealtime({
    table: 'live_sessions',
    onInsert: (payload) => {
      const session = payload.new as LiveSession;
      setSessions(prev => [session, ...prev]);
    },
    onUpdate: (payload) => {
      const updatedSession = payload.new as LiveSession;
      setSessions(prev => 
        prev.map(s => s.id === updatedSession.id ? updatedSession : s)
      );
    },
    onDelete: (payload) => {
      const deletedSession = payload.old as LiveSession;
      setSessions(prev => prev.filter(s => s.id !== deletedSession.id));
    }
  });

  // Load initial sessions
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const loadSessions = async () => {
      try {
        const { data, error } = await supabase
          .from('live_sessions')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSessions(data || []);
      } catch (error) {
        console.error('Error loading sessions:', error);
      }
    };

    loadSessions();
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isSupabaseConfigured() || !supabase) return;

    try {
      const { data, error } = await supabase
        .from('live_sessions')
        .insert([{
          name: newSession.name,
          description: newSession.description,
          host_user_id: user.id,
          participants: [user.id],
          settings: newSession.settings
        }])
        .select()
        .single();

      if (error) throw error;

      setShowCreateModal(false);
      setNewSession({
        name: '',
        description: '',
        settings: { maxParticipants: 10, isPublic: true }
      });
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleJoinSession = async (sessionId: string) => {
    if (!user || !isSupabaseConfigured() || !supabase) return;

    try {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;

      const updatedParticipants = [...session.participants, user.id];

      const { error } = await supabase
        .from('live_sessions')
        .update({ participants: updatedParticipants })
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error joining session:', error);
    }
  };

  const handleLeaveSession = async (sessionId: string) => {
    if (!user || !isSupabaseConfigured() || !supabase) return;

    try {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;

      const updatedParticipants = session.participants.filter(p => p !== user.id);

      const { error } = await supabase
        .from('live_sessions')
        .update({ participants: updatedParticipants })
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error leaving session:', error);
    }
  };

  if (!user || !isSupabaseConfigured()) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
        <div className="text-center">
          <Users className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            Live Collaboration
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Sign in and configure Supabase to collaborate in real-time
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            Live Collaboration
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Join or create real-time thinking sessions
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-2xl hover:bg-purple-600 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          Create Session
        </button>
      </div>

      {/* Active Sessions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((session) => {
          const isHost = session.host_user_id === user.id;
          const isParticipant = session.participants.includes(user.id);
          
          return (
            <div
              key={session.id}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">
                      {session.name}
                    </h3>
                    {isHost && (
                      <Crown className="w-4 h-4 text-yellow-500" title="Host" />
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    {session.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{session.participants.length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>Active</span>
                </div>
              </div>

              <div className="flex gap-2">
                {isParticipant ? (
                  <>
                    <button
                      onClick={() => handleLeaveSession(session.id)}
                      className="flex-1 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                    >
                      Leave
                    </button>
                    {isHost && (
                      <button className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                        <Settings className="w-4 h-4" />
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => handleJoinSession(session.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Join
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-8 max-w-md mx-auto">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
              No Active Sessions
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Create the first collaboration session and invite others to join
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
            >
              Create Session
            </button>
          </div>
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                Create Live Session
              </h2>
            </div>

            <form onSubmit={handleCreateSession} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Session Name
                </label>
                <input
                  type="text"
                  value={newSession.name}
                  onChange={(e) => setNewSession(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Morning Brainstorm"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newSession.description}
                  onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What's this session about?"
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}