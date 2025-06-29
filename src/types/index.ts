export interface ShowerThought {
  id: string;
  content: string;
  timestamp: Date;
  topic?: string;
  mood: 'philosophical' | 'humorous' | 'scientific';
  isFavorite: boolean;
  variations?: string[];
  source?: 'template' | 'openai';
  tokensUsed?: number;
  cost?: number;
}

export interface GenerationRequest {
  topic: string;
  mood: 'philosophical' | 'humorous' | 'scientific';
  useAI?: boolean;
}

export interface RateLimit {
  count: number;
  resetTime: number;
}

export interface AppState {
  thoughts: ShowerThought[];
  favorites: ShowerThought[];
  isLoading: boolean;
  error: string;
  showHistory: boolean;
  showFavorites: boolean;
}