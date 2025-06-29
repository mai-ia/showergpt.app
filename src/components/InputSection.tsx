import React, { useState } from 'react';
import { Droplets, Shuffle, Zap } from 'lucide-react';
import { GenerationRequest } from '../types';
import { getRandomTopic } from '../utils/thoughtGenerator';

interface InputSectionProps {
  onGenerate: (request: GenerationRequest) => void;
  isLoading: boolean;
  error?: string;
}

export default function InputSection({ onGenerate, isLoading, error }: InputSectionProps) {
  const [topic, setTopic] = useState('');
  const [mood, setMood] = useState<'philosophical' | 'humorous' | 'scientific'>('philosophical');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({ topic: topic.trim(), mood });
  };

  const handleRandomTopic = () => {
    setTopic(getRandomTopic());
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-blue-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-3 rounded-full">
          <Droplets className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Generate a Shower Thought</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-slate-700 mb-2">
            Topic or Theme (optional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., time, dreams, existence..."
              className="flex-1 px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 outline-none"
              maxLength={50}
            />
            <button
              type="button"
              onClick={handleRandomTopic}
              className="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors duration-300 flex items-center gap-2"
              title="Random Topic"
            >
              <Shuffle className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Thought Style
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { value: 'philosophical', label: 'Philosophical', desc: 'Deep & contemplative' },
              { value: 'humorous', label: 'Humorous', desc: 'Light & funny' },
              { value: 'scientific', label: 'Scientific', desc: 'Logical & curious' }
            ].map((option) => (
              <label
                key={option.value}
                className={`relative cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 ${
                  mood === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-blue-200 hover:border-blue-300 bg-white'
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
                  <div className="font-semibold text-slate-800">{option.label}</div>
                  <div className="text-sm text-slate-600">{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Generating...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Generate Shower Thought
            </>
          )}
        </button>
      </form>
    </div>
  );
}