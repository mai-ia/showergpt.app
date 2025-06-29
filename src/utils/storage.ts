import { ShowerThought } from '../types';

const STORAGE_KEY = 'showergpt-saved-thoughts';

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