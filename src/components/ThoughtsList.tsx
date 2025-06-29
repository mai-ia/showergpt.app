import React from 'react';
import { ShowerThought } from '../types';
import ThoughtCard from './ThoughtCard';

interface ThoughtsListProps {
  thoughts: ShowerThought[];
  onFavoriteChange?: () => void;
}

export default function ThoughtsList({ thoughts, onFavoriteChange }: ThoughtsListProps) {
  if (thoughts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-400 text-lg mb-2">No thoughts yet</div>
        <div className="text-slate-500 text-sm">Generate your first shower thought above!</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {thoughts.map((thought) => (
        <ThoughtCard
          key={thought.id}
          thought={thought}
          onFavoriteChange={onFavoriteChange}
        />
      ))}
    </div>
  );
}