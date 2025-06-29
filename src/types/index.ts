export interface ShowerThought {
  id: string;
  content: string;
  timestamp: Date;
  topic?: string;
  mood: 'philosophical' | 'humorous' | 'scientific';
  isFavorite: boolean;
}

export interface GenerationRequest {
  topic: string;
  mood: 'philosophical' | 'humorous' | 'scientific';
}

export interface RateLimit {
  count: number;
  resetTime: number;
}