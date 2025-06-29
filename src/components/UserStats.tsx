import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Heart, Zap, DollarSign, Brain } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserStats } from '../services/thoughtsService';

interface UserStatsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserStats({ isOpen, onClose }: UserStatsProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen, user]);

  const loadStats = async () => {
    setLoading(true);
    setError('');

    try {
      const userStats = await getUserStats(user?.id);
      setStats(userStats);
    } catch (err: any) {
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const StatCard = ({ icon: Icon, title, value, subtitle, color }: any) => (
    <div className={`bg-gradient-to-r ${color} p-6 rounded-2xl shadow-lg`}>
      <div className="flex items-center justify-between mb-4">
        <div className="bg-white bg-opacity-20 p-3 rounded-xl">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="text-white text-opacity-80 text-sm">{subtitle}</div>
        </div>
      </div>
      <h3 className="text-white font-semibold">{title}</h3>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-blue-200">
        <div className="sticky top-0 bg-white rounded-t-3xl border-b border-slate-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-2xl shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Your Statistics</h1>
              <p className="text-slate-600">Insights into your shower thinking journey</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <span className="text-2xl text-slate-600">×</span>
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-slate-600">Loading your statistics...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md mx-auto">
                <p className="text-red-700 font-medium">{error}</p>
                <button
                  onClick={loadStats}
                  className="mt-4 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : stats ? (
            <div className="space-y-8">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  icon={Brain}
                  title="Total Thoughts"
                  value={stats.totalThoughts}
                  subtitle="generated"
                  color="from-blue-500 to-blue-600"
                />
                <StatCard
                  icon={Heart}
                  title="Favorites"
                  value={stats.totalFavorites}
                  subtitle="saved"
                  color="from-red-500 to-red-600"
                />
                <StatCard
                  icon={Zap}
                  title="AI Tokens"
                  value={stats.totalTokensUsed.toLocaleString()}
                  subtitle="used"
                  color="from-purple-500 to-purple-600"
                />
                <StatCard
                  icon={DollarSign}
                  title="AI Cost"
                  value={`$${stats.totalCost.toFixed(4)}`}
                  subtitle="spent"
                  color="from-green-500 to-green-600"
                />
              </div>

              {/* Mood Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                  Thought Styles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="text-3xl mb-2">🤔</div>
                    <div className="text-2xl font-bold text-purple-700">{stats.moodBreakdown.philosophical}</div>
                    <div className="text-purple-600 font-medium">Philosophical</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <div className="text-3xl mb-2">😄</div>
                    <div className="text-2xl font-bold text-orange-700">{stats.moodBreakdown.humorous}</div>
                    <div className="text-orange-600 font-medium">Humorous</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="text-3xl mb-2">🔬</div>
                    <div className="text-2xl font-bold text-green-700">{stats.moodBreakdown.scientific}</div>
                    <div className="text-green-600 font-medium">Scientific</div>
                  </div>
                </div>
              </div>

              {/* Source Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Generation Sources</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-medium text-slate-700">Template Generated</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-700">{stats.sourceBreakdown.template}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="font-medium text-slate-700">AI Generated</span>
                    </div>
                    <span className="text-2xl font-bold text-purple-700">{stats.sourceBreakdown.openai}</span>
                  </div>
                </div>
              </div>

              {/* Insights */}
              {stats.totalThoughts > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Your Insights</h3>
                  <div className="space-y-3 text-slate-700">
                    <p>
                      🎯 Your favorite thinking style is{' '}
                      <strong>
                        {Object.entries(stats.moodBreakdown).reduce((a, b) => 
                          stats.moodBreakdown[a[0]] > stats.moodBreakdown[b[0]] ? a : b
                        )[0]}
                      </strong>
                    </p>
                    <p>
                      💝 You've favorited{' '}
                      <strong>{((stats.totalFavorites / stats.totalThoughts) * 100).toFixed(1)}%</strong>{' '}
                      of your thoughts
                    </p>
                    {stats.totalTokensUsed > 0 && (
                      <p>
                        🤖 Average AI tokens per thought:{' '}
                        <strong>{Math.round(stats.totalTokensUsed / stats.sourceBreakdown.openai)}</strong>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}