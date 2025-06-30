import { RateLimit } from '../types';

const RATE_LIMIT_KEY = 'showergpt-rate-limit';
const MAX_REQUESTS = 10;
const WINDOW_MINUTES = 1;

export function checkRateLimit(): { allowed: boolean; resetTime?: number } {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    const now = Date.now();
    
    if (!stored) {
      const newLimit: RateLimit = {
        count: 1,
        resetTime: now + (WINDOW_MINUTES * 60 * 1000)
      };
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newLimit));
      return { allowed: true };
    }
    
    const rateLimit: RateLimit = JSON.parse(stored);
    
    // Reset if window has passed
    if (now > rateLimit.resetTime) {
      const newLimit: RateLimit = {
        count: 1,
        resetTime: now + (WINDOW_MINUTES * 60 * 1000)
      };
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newLimit));
      return { allowed: true };
    }
    
    // Check if under limit
    if (rateLimit.count < MAX_REQUESTS) {
      rateLimit.count += 1;
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(rateLimit));
      return { allowed: true };
    }
    
    return { allowed: false, resetTime: rateLimit.resetTime };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return { allowed: true };
  }
}