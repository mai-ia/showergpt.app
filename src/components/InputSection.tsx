import React, { useState } from 'react';
import { Droplets, Shuffle, Zap, Lightbulb, Sparkles } from 'lucide-react';
import { GenerationRequest } from '../types';
import { getRandomTopic } from '../utils/thoughtGenerator';
import { isOpenAIConfigured } from '../services/openaiService';
import ApiUsageIndicator from './ApiUsageIndicator';
import CategorySelector from './CategorySelector';

interface InputSectionProps {
  onGenerate: (request: GenerationRequest) => void;
  isLoading: boolean;
  error?: string;
}

export default function InputSection({ onGenerate, isLoading, error }: InputSectionProps) {
  const [topic, setTopic] = useState('');
  const [mood, setMood] = useState<'philosophical' | 'humorous' | 'scientific'>('philosophical');
  const [category, setCategory] = useState('');
  const [useAI, setUseAI] = useState(isOpenAIConfigured());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({ topic: topic.trim(), mood, category, useAI });
  };

  const handleRandomTopic = () => {
    setTopic(getRandomTopic());
  };

  const moodOptions = [
    { 
      value: 'philosophical', 
      label: 'Philosophical', 
      desc: 'Deep & contemplative',
      icon: '🤔',
      gradient: 'from-purple-500 to-purple-600'
    },
    { 
      value: 'humorous', 
      label: 'Humorous', 
      desc: 'Light & funny',
      icon: '😄',
      gradient: 'from-orange-500 to-orange-600'
    },
    { 
      value: 'scientific', 
      label: 'Scientific', 
      desc: 'Logical & curious',
      icon: '🔬',
      gradient: 'from-green-500 to-green-600'
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 sm:p-10 mb-12 border border-blue-100 dark:border-slate-700 backdrop-blur-sm">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg">
          <Lightbulb className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Generate a Shower Thought</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Let your mind wander into the depths of contemplation</p>
        </div>
      </div>

      {/* AI Toggle and Usage Indicator */}
      {isOpenAIConfigured() && (
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    AI-Powered Generation
                  </span>
                </div>
              </label>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {useAI ? 'Using OpenAI for creative thoughts' : 'Using built-in templates'}
              </div>
            </div>
            {useAI && <ApiUsageIndicator />}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label htmlFor="topic" className="block text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Topic or Theme <span className="text-slate-500 font-normal">(optional)</span>
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., time, dreams, existence, consciousness..."
              className="flex-1 px-6 py-4 border-2 border-blue-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 transition-all duration-300 outline-none text-lg shadow-lg hover:shadow-xl bg-gradient-to-r from-white to-blue-50 dark:from-slate-700 dark:to-slate-600 text-slate-900 dark:text-slate-100"
              maxLength={50}
            />
            <button
              type="button"
              onClick={handleRandomTopic}
              className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
              title="Random Topic"
            >
              <Shuffle className="w-5 h-5" />
              <span className="hidden sm:inline font-medium">Random</span>
            </button>
          </div>
        </div>

        {/* Category Selection */}
        <CategorySelector
          selectedCategory={category}
          onCategoryChange={setCategory}
        />

        <div>
          <label className="block text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Thought Style
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {moodOptions.map((option) => (
              <label
                key={option.value}
                className={`relative cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                  mood === option.value
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 shadow-xl'
                    : 'border-blue-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-slate-500 bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 shadow-lg hover:shadow-xl'
                }`}
              >
                <input
                  type="radio"
                  name="mood"
                  value={option.value}
                  checked={mood === option.value}
                  onChange={(e) => setMood(e.target.value as any)}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-3xl mb-2">{option.icon}</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-1">{option.label}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{option.desc}</div>
                </div>
                {mood === option.value && (
                  <div className="absolute top-3 right-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 text-white font-bold py-6 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center gap-4 disabled:cursor-not-allowed shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 disabled:transform-none text-lg"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
              <span>
                {useAI ? 'AI is thinking...' : 'Generating...'}
              </span>
            </>
          ) : (
            <>
              {useAI ? <Sparkles className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
              <span>
                Generate {useAI ? 'AI-Powered' : ''} Shower Thought
              </span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}