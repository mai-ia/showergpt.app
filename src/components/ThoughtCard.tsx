import React, { useState } from 'react';
import { Heart, Share2, Copy, Clock, Sparkles } from 'lucide-react';
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

  const getMoodConfig = (mood: string) => {
    switch (mood) {
      case 'philosophical':
        return {
          color: 'text-purple-700 bg-gradient-to-r from-purple-100 to-purple-200',
          icon: '🤔',
          gradient: 'from-purple-50 to-purple-100'
        };
      case 'humorous':
        return {
          color: 'text-orange-700 bg-gradient-to-r from-orange-100 to-orange-200',
          icon: '😄',
          gradient: 'from-orange-50 to-orange-100'
        };
      case 'scientific':
        return {
          color: 'text-green-700 bg-gradient-to-r from-green-100 to-green-200',
          icon: '🔬',
          gradient: 'from-green-50 to-green-100'
        };
      default:
        return {
          color: 'text-blue-700 bg-gradient-to-r from-blue-100 to-blue-200',
          icon: '💭',
          gradient: 'from-blue-50 to-blue-100'
        };
    }
  };

  const moodConfig = getMoodConfig(thought.mood);

  return (
    <div className="group bg-white rounded-3xl shadow-xl p-8 border border-blue-100 hover:shadow-2xl hover:border-blue-200 transition-all duration-500 transform hover:scale-105 animate-fade-in relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${moodConfig.gradient}`}></div>
      
      {/* Floating sparkle decoration */}
      <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
        <Sparkles className="w-6 h-6 text-blue-400" />
      </div>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{moodConfig.icon}</span>
          <span className={`px-4 py-2 rounded-full text-sm font-bold ${moodConfig.color} shadow-lg`}>
            {thought.mood}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-sm bg-slate-50 px-3 py-2 rounded-full">
          <Clock className="w-4 h-4" />
          {formatTime(thought.timestamp)}
        </div>
      </div>

      <div className="mb-6">
        <p className="text-slate-800 text-xl leading-relaxed font-medium">
          "{thought.content}"
        </p>
      </div>

      {thought.topic && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 font-medium">Inspired by:</span>
            <span className="text-blue-700 font-bold">{thought.topic}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-6 border-t border-slate-100">
        <button
          onClick={handleFavorite}
          className={`flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 ${
            isSaved
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
              : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 hover:from-red-50 hover:to-red-100 hover:text-red-600'
          }`}
        >
          <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          <span>{isSaved ? 'Saved' : 'Save'}</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="p-3 rounded-2xl bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 hover:from-blue-50 hover:to-blue-100 hover:text-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            title="Copy to clipboard"
          >
            <Copy className="w-5 h-5" />
          </button>
          <button
            onClick={handleShare}
            className="p-3 rounded-2xl bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 hover:from-blue-50 hover:to-blue-100 hover:text-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            title="Share"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {copySuccess && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 animate-fade-in">
          <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
            ✨ Copied to clipboard!
          </div>
        </div>
      )}
    </div>
  );
}