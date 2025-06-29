import React, { useState } from 'react';
import { Heart, Share2, Copy, Clock } from 'lucide-react';
import { ShowerThought } from '../types';
import { saveThought, removeSavedThought, isThoughtSaved } from '../utils/storage';

interface ThoughtCardProps {
  thought: ShowerThought;
  onFavoriteChange?: () => void;
}

export default function ThoughtCard({ thought, onFavoriteChange }: ThoughtCardProps) {
  const [isSaved, setIsSaved] = useState(isThoughtSaved(thought.id));
  const [copySuccess, setCopySuccess] = useState(false);

  const handleFavorite = () => {
    if (isSaved) {
      removeSavedThought(thought.id);
      setIsSaved(false);
    } else {
      saveThought(thought);
      setIsSaved(true);
    }
    onFavoriteChange?.();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(thought.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Shower Thought from ShowerGPT',
          text: thought.content,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopy();
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(new Date(date));
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'philosophical': return 'text-purple-600 bg-purple-100';
      case 'humorous': return 'text-orange-600 bg-orange-100';
      case 'scientific': return 'text-green-600 bg-green-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 hover:shadow-xl transition-all duration-300 animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMoodColor(thought.mood)}`}>
          {thought.mood}
        </span>
        <div className="flex items-center gap-1 text-slate-500 text-sm">
          <Clock className="w-4 h-4" />
          {formatTime(thought.timestamp)}
        </div>
      </div>

      <p className="text-slate-800 text-lg leading-relaxed mb-6 font-medium">
        {thought.content}
      </p>

      {thought.topic && (
        <div className="mb-4">
          <span className="text-xs text-slate-500">Topic: </span>
          <span className="text-sm text-blue-600 font-medium">{thought.topic}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <button
            onClick={handleFavorite}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ${
              isSaved
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">
              {isSaved ? 'Saved' : 'Save'}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors duration-300"
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors duration-300"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {copySuccess && (
        <div className="mt-3 text-center">
          <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
            Copied to clipboard!
          </span>
        </div>
      )}
    </div>
  );
}