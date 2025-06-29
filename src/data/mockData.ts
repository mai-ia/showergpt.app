/*
 * Mock Data for Development and Fallback
 * Used when OpenAI API is not available or for testing
 */

import { ShowerThought } from '../types';

export const mockShowerThoughts: Record<string, ShowerThought[]> = {
  philosophical: [
    {
      id: 'mock-phil-1',
      content: 'If consciousness is just neurons firing, are we all just biological computers dreaming we\'re alive?',
      timestamp: new Date(),
      mood: 'philosophical',
      isFavorite: false,
      source: 'template',
      topic: 'consciousness'
    },
    {
      id: 'mock-phil-2',
      content: 'What if every decision creates a parallel universe where you chose differently?',
      timestamp: new Date(),
      mood: 'philosophical',
      isFavorite: false,
      source: 'template',
      topic: 'decisions'
    },
    {
      id: 'mock-phil-3',
      content: 'If time is relative, are we all time travelers moving at different speeds through existence?',
      timestamp: new Date(),
      mood: 'philosophical',
      isFavorite: false,
      source: 'template',
      topic: 'time'
    }
  ],
  humorous: [
    {
      id: 'mock-humor-1',
      content: 'Somewhere in the universe, an alien is probably confused by our obsession with putting pineapple on pizza.',
      timestamp: new Date(),
      mood: 'humorous',
      isFavorite: false,
      source: 'template',
      topic: 'food'
    },
    {
      id: 'mock-humor-2',
      content: 'If socks disappear in the dryer, maybe there\'s a parallel universe where people have too many socks.',
      timestamp: new Date(),
      mood: 'humorous',
      isFavorite: false,
      source: 'template',
      topic: 'laundry'
    },
    {
      id: 'mock-humor-3',
      content: 'Plants are basically solar-powered air purifiers that we keep as pets.',
      timestamp: new Date(),
      mood: 'humorous',
      isFavorite: false,
      source: 'template',
      topic: 'plants'
    }
  ],
  scientific: [
    {
      id: 'mock-sci-1',
      content: 'Every atom in your body was forged in the heart of a dying star - you\'re literally made of stardust.',
      timestamp: new Date(),
      mood: 'scientific',
      isFavorite: false,
      source: 'template',
      topic: 'atoms'
    },
    {
      id: 'mock-sci-2',
      content: 'Your brain uses about 20% of your body\'s energy just to keep you conscious and thinking.',
      timestamp: new Date(),
      mood: 'scientific',
      isFavorite: false,
      source: 'template',
      topic: 'brain'
    },
    {
      id: 'mock-sci-3',
      content: 'Light from distant stars takes so long to reach us that we\'re literally looking into the past every night.',
      timestamp: new Date(),
      mood: 'scientific',
      isFavorite: false,
      source: 'template',
      topic: 'stars'
    }
  ]
};

export const getRandomMockThought = (mood: string): ShowerThought => {
  const thoughts = mockShowerThoughts[mood] || mockShowerThoughts.philosophical;
  const randomThought = thoughts[Math.floor(Math.random() * thoughts.length)];
  
  return {
    ...randomThought,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date(),
  };
};

export const getMockThoughtByTopic = (topic: string, mood: string): ShowerThought => {
  const baseThought = getRandomMockThought(mood);
  
  // Simple topic-based content modification
  const topicTemplates = {
    philosophical: `What if ${topic} is just the universe's way of understanding itself through our consciousness?`,
    humorous: `Somewhere in the universe, an alien is probably confused by our relationship with ${topic}.`,
    scientific: `The quantum mechanics of ${topic} might be more complex than we currently understand.`
  };
  
  return {
    ...baseThought,
    content: topicTemplates[mood] || baseThought.content,
    topic: topic,
  };
};