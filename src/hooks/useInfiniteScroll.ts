import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
  hasMore: boolean;
  loading: boolean;
}

export function useInfiniteScroll(
  fetchMore: () => void,
  options: UseInfiniteScrollOptions
) {
  const { threshold = 1.0, rootMargin = '100px', hasMore, loading } = options;
  const [isFetching, setIsFetching] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !loading && !isFetching) {
        setIsFetching(true);
        fetchMore();
      }
    },
    [fetchMore, hasMore, loading, isFetching]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold,
      rootMargin
    });

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [handleObserver, threshold, rootMargin]);

  useEffect(() => {
    if (!loading) {
      setIsFetching(false);
    }
  }, [loading]);

  return { loadMoreRef, isFetching };
}

// Virtualized infinite scroll hook
export function useVirtualizedInfiniteScroll<T>(
  items: T[],
  fetchMore: () => Promise<T[]>,
  options: {
    pageSize?: number;
    threshold?: number;
    hasMore: boolean;
  }
) {
  const { pageSize = 20, threshold = 5, hasMore } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      await fetchMore();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load more'));
    } finally {
      setLoading(false);
    }
  }, [fetchMore, loading, hasMore]);

  // Check if we need to load more items
  const shouldLoadMore = useCallback((lastItemIndex: number) => {
    return (
      hasMore &&
      !loading &&
      lastItemIndex >= items.length - threshold
    );
  }, [hasMore, loading, items.length, threshold]);

  return {
    loading,
    error,
    loadMore,
    shouldLoadMore
  };
}