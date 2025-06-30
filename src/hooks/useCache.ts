import { useState, useEffect, useCallback } from 'react';
import { debug } from '../utils/debugHelpers';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  set<T>(key: string, data: T, ttl = 5 * 60 * 1000): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    debug.log(`Cache: Set item "${key}" with TTL ${ttl}ms`);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      debug.log(`Cache: Miss for key "${key}"`);
      return null;
    }
    
    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      debug.log(`Cache: Entry expired for key "${key}"`);
      this.cache.delete(key);
      return null;
    }
    
    debug.log(`Cache: Hit for key "${key}"`);
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  clear(): void {
    debug.log('Cache: Clearing all items');
    this.cache.clear();
  }
  
  clearByPrefix(prefix: string): void {
    debug.log(`Cache: Clearing items with prefix "${prefix}"`);
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  size(): number {
    return this.cache.size;
  }
}

const globalCache = new MemoryCache();

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = { ttl: 300000 }
) {
  const { ttl = 5 * 60 * 1000, maxSize = 100 } = options; // Default 5 minutes
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    debug.log(`useCache: Fetching data for key "${key}" (forceRefresh=${forceRefresh})`);
    
    // Check cache first
    if (!forceRefresh && globalCache.has(key)) {
      const cachedData = globalCache.get<T>(key);
      if (cachedData) {
        debug.log(`useCache: Using cached data for key "${key}"`);
        setData(cachedData);
        return cachedData;
      }
    }

    setLoading(true);
    setError(null);

    try {
      debug.log(`useCache: Executing fetcher for key "${key}"`);
      const result = await fetcher();
      globalCache.set(key, result, ttl);
      setData(result);
      debug.log(`useCache: Successfully fetched and cached data for key "${key}"`);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      debug.error(`useCache: Error fetching data for key "${key}":`, error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const invalidate = useCallback(() => {
    debug.log(`useCache: Invalidating cache for key "${key}"`);
    globalCache.clear();
  }, [key]);
  
  const invalidatePrefix = useCallback((prefix: string) => {
    debug.log(`useCache: Invalidating cache with prefix "${prefix}"`);
    globalCache.clearByPrefix(prefix);
  }, []);

  const refresh = useCallback(() => {
    debug.log(`useCache: Refreshing data for key "${key}"`);
    return fetchData(true);
  }, [fetchData, key]);

  return {
    data,
    loading,
    error,
    refresh,
    invalidate,
    invalidatePrefix
  };
}

// Persistent cache using localStorage
export function usePersistentCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = { ttl: 600000 }
) {
  const { ttl = 30 * 60 * 1000 } = options; // 30 minutes default (600000 = 10 minutes)
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cacheKey = `cache_${key}`;

  const getFromStorage = useCallback((): T | null => {
    try {
      debug.log(`usePersistentCache: Checking localStorage for key "${cacheKey}"`);
      const stored = localStorage.getItem(cacheKey);
      if (!stored) {
        debug.log(`usePersistentCache: No data in localStorage for key "${cacheKey}"`);
        return null;
      }

      const parsed = JSON.parse(stored);
      if (Date.now() - parsed.timestamp > ttl) {
        debug.log(`usePersistentCache: Data expired for key "${cacheKey}"`);
        localStorage.removeItem(cacheKey);
        return null;
      }

      debug.log(`usePersistentCache: Found valid data in localStorage for key "${cacheKey}"`);
      return parsed.data;
    } catch (error) {
      debug.error(`usePersistentCache: Error reading from localStorage for key "${cacheKey}":`, error);
      return null;
    }
  }, [cacheKey, ttl]);

  const saveToStorage = useCallback((data: T) => {
    try {
      debug.log(`usePersistentCache: Saving to localStorage for key "${cacheKey}"`);
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      debug.warn(`usePersistentCache: Failed to save to localStorage for key "${cacheKey}":`, error);
    }
  }, [cacheKey]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    debug.log(`usePersistentCache: Fetching data for key "${key}" (forceRefresh=${forceRefresh})`);
    
    // Check localStorage first
    if (!forceRefresh) {
      const cachedData = getFromStorage();
      if (cachedData) {
        debug.log(`usePersistentCache: Using cached data for key "${key}"`);
        setData(cachedData);
        return cachedData;
      }
    }

    setLoading(true);
    setError(null);

    try {
      debug.log(`usePersistentCache: Executing fetcher for key "${key}"`);
      const result = await fetcher();
      saveToStorage(result);
      setData(result);
      debug.log(`usePersistentCache: Successfully fetched and cached data for key "${key}"`);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      debug.error(`usePersistentCache: Error fetching data for key "${key}":`, error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, getFromStorage, saveToStorage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    debug.log(`usePersistentCache: Refreshing data for key "${key}"`);
    return fetchData(true);
  }, [fetchData, key]);

  const invalidate = useCallback(() => {
    debug.log(`usePersistentCache: Invalidating cache for key "${cacheKey}"`);
    localStorage.removeItem(cacheKey);
  }, [cacheKey]);

  return {
    data,
    loading,
    error,
    refresh,
    invalidate
  };
}

export default {
  globalCache,
  useCache,
  usePersistentCache
};