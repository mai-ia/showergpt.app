import { ShowerThought } from '../types';

const STORAGE_KEY = 'showergpt-saved-thoughts';
const HISTORY_KEY = 'showergpt-history';
const FAVORITES_KEY = 'showergpt-favorites';

export function getSavedThoughts(): ShowerThought[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
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
    return history ? JSON.parse(history) : [];
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

// Favorites management
export function getFavorites(): ShowerThought[] {
  try {
    const favorites = localStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Error loading favorites:', error);
    return [];
  }
}

export function addToFavorites(thought: ShowerThought): void {
  try {
    const favorites = getFavorites();
    const updated = [...favorites, { ...thought, isFavorite: true }];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error adding to favorites:', error);
  }
}

export function removeFromFavorites(thoughtId: string): void {
  try {
    const favorites = getFavorites();
    const updated = favorites.filter(thought => thought.id !== thoughtId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error removing from favorites:', error);
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