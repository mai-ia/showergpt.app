import React, { memo, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { ShowerThought } from '../types';
import ThoughtCard from './ThoughtCard';

interface VirtualizedThoughtsListProps {
  thoughts: ShowerThought[];
  onFavoriteChange?: (thought: ShowerThought, isFavorite: boolean) => void;
  onRegenerate?: (thought: ShowerThought) => void;
  onExport?: (thought: ShowerThought) => void;
  height?: number;
  itemHeight?: number;
}

interface ItemData {
  thoughts: ShowerThought[];
  onFavoriteChange?: (thought: ShowerThought, isFavorite: boolean) => void;
  onRegenerate?: (thought: ShowerThought) => void;
  onExport?: (thought: ShowerThought) => void;
}

const ThoughtItem = memo(function ThoughtItem({ 
  index, 
  style, 
  data 
}: { 
  index: number; 
  style: React.CSSProperties; 
  data: ItemData;
}) {
  const { thoughts, onFavoriteChange, onRegenerate, onExport } = data;
  const thought = thoughts[index];

  if (!thought) return null;

  return (
    <div style={style} className="px-4 py-2">
      <ThoughtCard
        thought={thought}
        onFavoriteChange={onFavoriteChange}
        onRegenerate={onRegenerate}
        onExport={onExport}
      />
    </div>
  );
});

const VirtualizedThoughtsList = memo(function VirtualizedThoughtsList({
  thoughts,
  onFavoriteChange,
  onRegenerate,
  onExport,
  height = 600,
  itemHeight = 300
}: VirtualizedThoughtsListProps) {
  const itemData = useMemo(() => ({
    thoughts,
    onFavoriteChange,
    onRegenerate,
    onExport
  }), [thoughts, onFavoriteChange, onRegenerate, onExport]);

  if (thoughts.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-12 border border-blue-100 dark:border-slate-700 max-w-md mx-auto">
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
              <span className="text-4xl">💭</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">
            No thoughts yet
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Generate your first shower thought above and let the wisdom flow! 🚿
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <List
        height={height}
        itemCount={thoughts.length}
        itemSize={itemHeight}
        itemData={itemData}
        className="scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-blue-100 dark:scrollbar-track-slate-700"
      >
        {ThoughtItem}
      </List>
    </div>
  );
});

export default VirtualizedThoughtsList;