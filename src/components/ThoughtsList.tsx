import React from 'react';
import { Droplets } from 'lucide-react';
import { ShowerThought } from '../types';
import ThoughtCard from './ThoughtCard';

interface ThoughtsListProps {
  thoughts: ShowerThought[];
  onFavoriteChange?: () => void;
}

export default function ThoughtsList({ thoughts, onFavoriteChange }: ThoughtsListProps) {
  if (thoughts.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="bg-white rounded-3xl shadow-xl p-12 border border-blue-100 max-w-md mx-auto">
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
              <Droplets className="w-12 h-12 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3">No thoughts yet</h3>
          <p className="text-slate-600 text-lg">
            Generate your first shower thought above and let the wisdom flow! 🚿
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {thoughts.map((thought, index) => (
        <div
          key={thought.id}
          style={{
            animationDelay: `${index * 100}ms`
          }}
        >
          <ThoughtCard
            thought={thought}
            onFavoriteChange={onFavoriteChange}
          />
        </div>
      ))}
    </div>
  );
}