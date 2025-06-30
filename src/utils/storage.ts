import { ShowerThought } from '../types';
import { saveThought, getUserThoughts, addToFavorites, removeFromFavorites, getUserFavorites, deleteThought } from '../services/thoughtsService';

const STORAGE_KEY = 'showergpt-saved-thoughts';
const HISTORY_KEY = 'showergpt-history';
const FAVORITES_KEY = 'showergpt-favorites';

// Helper function to convert timestamp strings back to Date objects
function convertTimestampToDate(thought: any): ShowerThought {
  return {
    ...thought,
    timestamp: thought.timestamp ? new Date(thought.timestamp) : new Date(),
    favoritedAt: thought.favoritedAt ? new Date(thought.favoritedAt) : undefined
  };
}

// Legacy functions for backward compatibility
export function getSavedThoughts(): ShowerThought[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const thoughts = saved ? JSON.parse(saved) : [];
    return thoughts.map(convertTimestampToDate);
  } catch (error) {
    console.error('Error loading saved thoughts:', error);
    return [];
  }
}

export function saveThought(thought: ShowerThought): void {
  try {
    const saved = getSavedThoughts();
    const updated = [...saved, { ...thought, isFavorite: true }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving thought:', error);
  }
}

export function removeSavedThought(thoughtId: string): void {
  try {
    const saved = getSavedThoughts();
    const updated = saved.filter(thought => thought.id !== thoughtId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error removing saved thought:', error);
  }
}

export function isThoughtSaved(thoughtId: string): boolean {
  const saved = getSavedThoughts();
  return saved.some(thought => thought.id === thoughtId);
}

// History management
export function getThoughtHistory(): ShowerThought[] {
  try {
    const history = localStorage.getItem(HISTORY_KEY);
    const thoughts = history ? JSON.parse(history) : [];
    return thoughts.map(convertTimestampToDate);
  } catch (error) {
    console.error('Error loading thought history:', error);
    return [];
  }
}

export function addToHistory(thought: ShowerThought): void {
  try {
    const history = getThoughtHistory();
    const updated = [thought, ...history.slice(0, 49)]; // Keep last 50 thoughts
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error adding to history:', error);
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing history:', error);
  }
}

// Favorites management - Updated to use new service
export function getFavorites(): ShowerThought[] {
  try {
    const favorites = localStorage.getItem(FAVORITES_KEY);
    const thoughts = favorites ? JSON.parse(favorites) : [];
    return thoughts.map(convertTimestampToDate);
  } catch (error) {
    console.error('Error loading favorites:', error);
    return [];
  }
}

export async function addToFavorites(thought: ShowerThought, userId?: string): Promise<void> {
  try {
    if (userId) {
      await addToFavorites(thought, userId);
    } else {
      // Fallback to local storage
      const favorites = getFavorites();
      const updated = [...favorites, { ...thought, isFavorite: true }];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    }
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
}

export async function removeFromFavorites(thoughtId: string, userId?: string): Promise<void> {
  try {
    if (userId) {
      await removeFromFavorites(thoughtId, userId);
    } else {
      // Fallback to local storage
      const favorites = getFavorites();
      const updated = favorites.filter(thought => thought.id !== thoughtId);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    }
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
}

// Export functionality
export function exportThoughts(thoughts: ShowerThought[], filename: string = 'shower-thoughts'): void {
  try {
    const content = thoughts.map(thought => {
      const date = new Date(thought.timestamp).toLocaleDateString();
      const time = new Date(thought.timestamp).toLocaleTimeString();
      return `${thought.content}\n- Generated on ${date} at ${time}\n- Mood: ${thought.mood}${thought.topic ? `\n- Topic: ${thought.topic}` : ''}\n\n`;
    }).join('---\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting thoughts:', error);
    throw new Error('Failed to export thoughts');
  }
}