import React, { useState, useCallback } from 'react';
import { Droplets, Shuffle, Zap, Lightbulb, Sparkles, Wand2 } from 'lucide-react';
import { GenerationRequest } from '../../types';
import { getRandomTopic } from '../../utils/thoughtGenerator';
import { isOpenAIConfigured } from '../../services/openaiService';
import { useToast } from '../ui/Toast';
import { useDebouncedCallback } from '../../hooks/useDebounce';
import ApiUsageIndicator from '../ApiUsageIndicator';
import CategorySelector from '../CategorySelector';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Tooltip from '../ui/Tooltip';
import LoadingSpinner from '../ui/LoadingSpinner';

interface EnhancedInputSectionProps {
  onGenerate: (request: GenerationRequest) => void;
  isLoading: boolean;
  error?: string;
}

export default function EnhancedInputSection({ onGenerate, isLoading, error }: EnhancedInputSectionProps) {
  const { error: showError } = useToast();
  const [topic, setTopic] = useState('');
  const [mood, setMood] = useState<'philosophical' | 'humorous' | 'scientific'>('philosophical');
  const [category, setCategory] = useState('');
  const [useAI, setUseAI] = useState(isOpenAIConfigured());
  const [isGenerating, setIsGenerating] = useState(false);

  const debouncedGenerate = useDebouncedCallback((request: GenerationRequest) => {
    onGenerate(request);
  }, 300);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading || isGenerating) return;
    
    setIsGenerating(true);
    
    const request: GenerationRequest = {
      topic: topic.trim(),
      mood,
      category,
      useAI
    };
    
    debouncedGenerate(request);
    
    // Reset generating state after a delay
    setTimeout(() => setIsGenerating(false), 1000);
  }, [topic, mood, category, useAI, isLoading, isGenerating, debouncedGenerate]);

  const handleRandomTopic = useCallback(() => {
    const randomTopic = getRandomTopic();
    setTopic(randomTopic);
  }, []);

  const handleQuickGenerate = useCallback((quickMood: typeof mood) => {
    if (isLoading || isGenerating) return;
    
    setMood(quickMood);
    setIsGenerating(true);
    
    const request: GenerationRequest = {
      topic: topic.trim(),
      mood: quickMood,
      category,
      useAI
    };
    
    debouncedGenerate(request);
    setTimeout(() => setIsGenerating(false), 1000);
  }, [topic, category, useAI, isLoading, isGenerating, debouncedGenerate]);

  const moodOptions = [
    { 
      value: 'philosophical', 
      label: 'Philosophical', 
      desc: 'Deep & contemplative thoughts that question reality',
      icon: '🤔',
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20'
    },
    { 
      value: 'humorous', 
      label: 'Humorous', 
      desc: 'Light & funny observations about life',
      icon: '😄',
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20'
    },
    { 
      value: 'scientific', 
      label: 'Scientific', 
      desc: 'Logical & curious explorations of nature',
      icon: '🔬',
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20'
    }
  ];

  return (
    <Card variant="elevated" className="mb-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg">
          <Lightbulb className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
            Generate a Shower Thought
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Let your mind wander into the depths of contemplation
          </p>
        </div>
      </div>

      {/* AI Toggle and Usage Indicator */}
      {isOpenAIConfigured() && (
        <Card variant="glass" padding="md" className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={useAI}
                    onChange={(e) => setUseAI(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`
                    w-12 h-6 rounded-full transition-all duration-300 
                    ${useAI ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 'bg-slate-300 dark:bg-slate-600'}
                  `}>
                    <div className={`
                      w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 transform
                      ${useAI ? 'translate-x-6' : 'translate-x-0.5'} mt-0.5
                    `} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
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
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Topic Input */}
        <div>
          <div className="flex gap-3">
            <Input
              label="Topic or Theme"
              helperText="Optional: Enter a topic to inspire your thought"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., time, dreams, existence, consciousness..."
              maxLength={50}
              leftIcon={<Wand2 className="w-5 h-5" />}
              className="flex-1"
            />
            <div className="flex flex-col justify-end">
              <Tooltip content="Get a random topic for inspiration">
                <Button
                  type="button"
                  onClick={handleRandomTopic}
                  variant="outline"
                  size="md"
                  leftIcon={<Shuffle className="w-5 h-5" />}
                  className="whitespace-nowrap"
                >
                  <span className="hidden sm:inline">Random</span>
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Category Selection */}
        <CategorySelector
          selectedCategory={category}
          onCategoryChange={setCategory}
        />

        {/* Mood Selection */}
        <div>
          <label className="block text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Thought Style
          </label>
          
          {/* Quick Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {moodOptions.map((option) => (
              <Tooltip key={option.value} content={option.desc}>
                <button
                  type="button"
                  onClick={() => handleQuickGenerate(option.value as typeof mood)}
                  disabled={isLoading || isGenerating}
                  className={`
                    relative p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 text-center group
                    ${mood === option.value
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 shadow-xl'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 shadow-lg hover:shadow-xl'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                  `}
                >
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    {option.icon}
                  </div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-2">
                    {option.label}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    {option.desc}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500 font-medium">
                    Click to generate instantly
                  </div>
                  
                  {/* Selection indicator */}
                  {mood === option.value && (
                    <div className="absolute top-3 right-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                  
                  {/* Loading indicator for quick generate */}
                  {isGenerating && mood === option.value && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <LoadingSpinner variant="shower" size="md" />
                    </div>
                  )}
                </button>
              </Tooltip>
            ))}
          </div>

          {/* Traditional Radio Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {moodOptions.map((option) => (
              <label
                key={option.value}
                className={`
                  relative cursor-pointer p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 text-center
                  ${mood === option.value
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 shadow-xl'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 shadow-lg hover:shadow-xl'
                  }
                `}
              >
                <input
                  type="radio"
                  name="mood"
                  value={option.value}
                  checked={mood === option.value}
                  onChange={(e) => setMood(e.target.value as any)}
                  className="sr-only"
                />
                <div className="text-2xl mb-2">{option.icon}</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 text-base mb-1">
                  {option.label}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {option.desc}
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

        {/* Error Display */}
        {error && (
          <Card variant="outlined" className="border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
            <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <p className="font-medium">{error}</p>
            </div>
          </Card>
        )}

        {/* Generate Button */}
        <Button
          type="submit"
          disabled={isLoading || isGenerating}
          variant="primary"
          size="xl"
          fullWidth
          leftIcon={
            isLoading || isGenerating ? (
              <LoadingSpinner variant="shower" size="md" color="blue" />
            ) : useAI ? (
              <Sparkles className="w-6 h-6" />
            ) : (
              <Zap className="w-6 h-6" />
            )
          }
          className="text-lg font-bold"
        >
          {isLoading || isGenerating ? (
            useAI ? 'AI is thinking...' : 'Generating...'
          ) : (
            `Generate ${useAI ? 'AI-Powered' : ''} Shower Thought`
          )}
        </Button>
      </form>
    </Card>
  );
}