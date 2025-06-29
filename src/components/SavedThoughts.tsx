import React, { useState, useEffect } from 'react';
import { Heart, X } from 'lucide-react';
import { ShowerThought } from '../types';
import { getSavedThoughts, removeSavedThought } from '../utils/storage';
import ThoughtCard from './ThoughtCard';

interface SavedThoughtsProps {
  onClose: () => void;
  refreshTrigger: number;
}

export default function SavedThoughts({ onClose, refreshTrigger }: SavedThoughtsProps) {
  const [savedThoughts, setSavedThoughts] = useState<ShowerThought[]>([]);

  useEffect(() => {
    setSavedThoughts(getSavedThoughts());
  }, [refreshTrigger]);

  const handleFavoriteChange = () => {
    setSavedThoughts(getSavedThoughts());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-full">
              <Heart className="w-5 h-5 text-red-600 fill-current" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              Saved Thoughts ({savedThoughts.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors duration-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {savedThoughts.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">No saved thoughts yet</h3>
              <p className="text-slate-500">Save your favorite shower thoughts to see them here!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savedThoughts.map((thought) => (
                <ThoughtCard
                  key={thought.id}
                  thought={thought}
                  onFavoriteChange={handleFavoriteChange}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}