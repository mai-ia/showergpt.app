import { ThoughtCategory } from '../types';

export const thoughtCategories: ThoughtCategory[] = [
  {
    id: 'existence',
    name: 'Existence',
    color: 'bg-purple-500',
    icon: '🌌',
    description: 'Deep thoughts about being and reality'
  },
  {
    id: 'time',
    name: 'Time',
    color: 'bg-blue-500',
    icon: '⏰',
    description: 'Temporal paradoxes and time perception'
  },
  {
    id: 'consciousness',
    name: 'Consciousness',
    color: 'bg-pink-500',
    icon: '🧠',
    description: 'Mind, awareness, and perception'
  },
  {
    id: 'society',
    name: 'Society',
    color: 'bg-green-500',
    icon: '🏛️',
    description: 'Human behavior and social constructs'
  },
  {
    id: 'technology',
    name: 'Technology',
    color: 'bg-cyan-500',
    icon: '💻',
    description: 'Digital age observations and tech philosophy'
  },
  {
    id: 'nature',
    name: 'Nature',
    color: 'bg-emerald-500',
    icon: '🌿',
    description: 'Natural world and environmental thoughts'
  },
  {
    id: 'language',
    name: 'Language',
    color: 'bg-orange-500',
    icon: '💬',
    description: 'Words, communication, and meaning'
  },
  {
    id: 'science',
    name: 'Science',
    color: 'bg-indigo-500',
    icon: '🔬',
    description: 'Scientific concepts and discoveries'
  },
  {
    id: 'everyday',
    name: 'Everyday Life',
    color: 'bg-yellow-500',
    icon: '🏠',
    description: 'Common experiences and daily observations'
  },
  {
    id: 'abstract',
    name: 'Abstract',
    color: 'bg-violet-500',
    icon: '🎭',
    description: 'Conceptual and theoretical ideas'
  }
];

export const getCategoryById = (id: string): ThoughtCategory | undefined => {
  return thoughtCategories.find(cat => cat.id === id);
};

export const getCategoryColor = (categoryId?: string): string => {
  const category = getCategoryById(categoryId || '');
  return category?.color || 'bg-slate-500';
};