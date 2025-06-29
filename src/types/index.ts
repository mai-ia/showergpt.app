export interface ShowerThought {
  id: string;
  content: string;
  timestamp: Date;
  topic?: string;
  mood: 'philosophical' | 'humorous' | 'scientific';
  category?: string;
  tags?: string[];
  isFavorite: boolean;
  variations?: string[];
  source?: 'template' | 'openai';
  tokensUsed?: number;
  cost?: number;
  views?: number;
  likes?: number;
  shares?: number;
}

export interface GenerationRequest {
  topic: string;
  mood: 'philosophical' | 'humorous' | 'scientific';
  category?: string;
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

export interface ThoughtCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string;
}

export interface SearchFilters {
  query: string;
  mood: string;
  category: string;
  source: string;
  dateRange: string;
}

export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    accent: string;
  };
}