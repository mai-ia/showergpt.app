import React, { memo } from 'react';
import { ShowerThought } from '../../types';
import ThoughtCard from '../ThoughtCard';

interface MemoizedThoughtCardProps {
  thought: ShowerThought;
  onFavoriteChange?: (thought: ShowerThought, isFavorite: boolean) => void;
  onRegenerate?: (thought: ShowerThought) => void;
  onExport?: (thought: ShowerThought) => void;
  showAuthor?: boolean;
}

const MemoizedThoughtCard = memo(function MemoizedThoughtCard(props: MemoizedThoughtCardProps) {
  return <ThoughtCard {...props} />;
}, (prevProps, nextProps) => {
  // Deep comparison for optimal memoization
  const thoughtChanged = (
    prevProps.thought.id !== nextProps.thought.id ||
    prevProps.thought.content !== nextProps.thought.content ||
    prevProps.thought.isFavorite !== nextProps.thought.isFavorite ||
    prevProps.thought.likes !== nextProps.thought.likes ||
    prevProps.thought.views !== nextProps.thought.views ||
    prevProps.thought.shares !== nextProps.thought.shares ||
    prevProps.thought.timestamp.getTime() !== nextProps.thought.timestamp.getTime()
  );

  const propsChanged = (
    prevProps.showAuthor !== nextProps.showAuthor ||
    prevProps.onFavoriteChange !== nextProps.onFavoriteChange ||
    prevProps.onRegenerate !== nextProps.onRegenerate ||
    prevProps.onExport !== nextProps.onExport
  );

  // Return true if nothing changed (skip re-render)
  return !thoughtChanged && !propsChanged;
});

export default MemoizedThoughtCard;