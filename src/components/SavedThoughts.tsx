import React, { useState, useEffect, memo } from 'react';
import { Heart, X, Droplets } from 'lucide-react';
import { ShowerThought } from '../types';
import { getUserFavorites } from '../services/thoughtsService';
import { useAuth } from '../contexts/AuthContext';
import ThoughtCard from './ThoughtCard';

interface SavedThoughtsProps {
  onClose: () => void;
  refreshTrigger: number;
}

const SavedThoughts = memo(function SavedThoughts({ onClose, refreshTrigger }: SavedThoughtsProps) {
  const { user } = useAuth();
  const [savedThoughts, setSavedThoughts] = useState<ShowerThought[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSavedThoughts();
  }, [refreshTrigger, user]);

  const loadSavedThoughts = async () => {
    setLoading(true);
    setError('');

    try {
      const favorites = await getUserFavorites(user?.id);
      setSavedThoughts(favorites);
    } catch (err: any) {
      setError(err.message || 'Failed to load saved thoughts');
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteChange = () => {
    loadSavedThoughts(); // Reload the list when favorites change
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-blue-200">
        <div className="flex items-center justify-between p-8 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-3 rounded-2xl shadow-lg">
              <Heart className="w-6 h-6 text-white fill-current" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Saved Thoughts
              </h2>
              <p className="text-slate-600 mt-1">
                {loading ? 'Loading...' : `${savedThoughts.length} brilliant ${savedThoughts.length === 1 ? 'thought' : 'thoughts'} saved`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-2xl bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-slate-600">Loading your saved thoughts...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md mx-auto">
                <p className="text-red-700 font-medium mb-4">{error}</p>
                <button
                  onClick={loadSavedThoughts}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : savedThoughts.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-gradient-to-r from-red-50 to-red-100 p-8 rounded-3xl max-w-md mx-auto">
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-red-100 to-red-200 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                    <Heart className="w-12 h-12 text-red-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">No saved thoughts yet</h3>
                <p className="text-slate-600 text-lg">
                  Save your favorite shower thoughts to see them here! 💭
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {savedThoughts.map((thought, index) => (
                <div
                  key={thought.id}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <ThoughtCard
                    thought={thought}
                    onFavoriteChange={handleFavoriteChange}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if refreshTrigger changes
  return prevProps.refreshTrigger === nextProps.refreshTrigger;
});

export default SavedThoughts;