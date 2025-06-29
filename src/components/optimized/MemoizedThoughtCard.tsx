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
  // Custom comparison function for better memoization
  return (
    prevProps.thought.id === nextProps.thought.id &&
    prevProps.thought.content === nextProps.thought.content &&
    prevProps.thought.isFavorite === nextProps.thought.isFavorite &&
    prevProps.thought.likes === nextProps.thought.likes &&
    prevProps.thought.views === nextProps.thought.views &&
    prevProps.thought.shares === nextProps.thought.shares &&
    prevProps.showAuthor === nextProps.showAuthor
  );
});

export default MemoizedThoughtCard;