export interface ShowerThought {
  id: string;
  content: string;
  timestamp: Date;
  topic?: string;
  mood: 'philosophical' | 'humorous' | 'scientific';
  isFavorite: boolean;
  variations?: string[];
}

export interface GenerationRequest {
  topic: string;
  mood: 'philosophical' | 'humorous' | 'scientific';
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