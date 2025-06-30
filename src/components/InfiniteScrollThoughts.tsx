import React, { useState, useEffect, useCallback, memo } from 'react';
import { ShowerThought, SearchFilters } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getUserThoughts } from '../services/thoughtsService';
import ThoughtCard from './ThoughtCard';
import SearchAndFilter from './SearchAndFilter';
import { Loader2 } from 'lucide-react';
import { debug } from '../utils/debugHelpers';

interface InfiniteScrollThoughtsProps {
  onFavoriteChange?: (thought: ShowerThought, isFavorite: boolean) => void;
  onRegenerate?: (thought: ShowerThought) => void;
  onExport?: (thought: ShowerThought) => void;
}

const InfiniteScrollThoughts = memo(function InfiniteScrollThoughts({ 
  onFavoriteChange, 
  onRegenerate, 
  onExport 
}: InfiniteScrollThoughtsProps) {
  const { user } = useAuth();
  const [thoughts, setThoughts] = useState<ShowerThought[]>([]);
  const [filteredThoughts, setFilteredThoughts] = useState<ShowerThought[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    mood: 'all',
    category: 'all',
    source: 'all',
    dateRange: 'all'
  });

  const ITEMS_PER_PAGE = 12;

  // Load initial thoughts
  useEffect(() => {
    debug.log('InfiniteScrollThoughts: Initial load');
    loadThoughts(true);
  }, [user]);

  // Filter thoughts when filters change
  useEffect(() => {
    debug.log('InfiniteScrollThoughts: Filters changed, applying filters');
    filterThoughts();
  }, [thoughts, filters]);

  // Infinite scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
      ) {
        if (!loading && hasMore) {
          debug.log('InfiniteScrollThoughts: Scroll threshold reached, loading more');
          loadThoughts(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore]);

  const loadThoughts = async (reset = false) => {
    if (loading) return;

    setLoading(true);
    setError(null);
    
    try {
      debug.log(`InfiniteScrollThoughts: Loading thoughts (reset=${reset})`);
      const currentPage = reset ? 1 : page;
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      
      debug.log(`InfiniteScrollThoughts: Fetching page ${currentPage}, offset ${offset}`);
      const newThoughts = await getUserThoughts(user?.id, ITEMS_PER_PAGE, offset);
      debug.log(`InfiniteScrollThoughts: Fetched ${newThoughts.length} thoughts`);
      
      if (reset) {
        debug.log('InfiniteScrollThoughts: Resetting thoughts list');
        setThoughts(newThoughts);
        setPage(2);
      } else {
        debug.log('InfiniteScrollThoughts: Appending to thoughts list');
        // Avoid duplicates by checking IDs
        const existingIds = new Set(thoughts.map(t => t.id));
        const uniqueNewThoughts = newThoughts.filter(t => !existingIds.has(t.id));
        
        debug.log(`InfiniteScrollThoughts: Adding ${uniqueNewThoughts.length} unique thoughts`);
        setThoughts(prev => [...prev, ...uniqueNewThoughts]);
        setPage(prev => prev + 1);
      }
      
      setHasMore(newThoughts.length === ITEMS_PER_PAGE);
      debug.log(`InfiniteScrollThoughts: Has more? ${newThoughts.length === ITEMS_PER_PAGE}`);
    } catch (error) {
      debug.error('InfiniteScrollThoughts: Error loading thoughts:', error);
      setError('Failed to load thoughts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterThoughts = useCallback(() => {
    debug.log('InfiniteScrollThoughts: Filtering thoughts');
    let filtered = [...thoughts];

    // Text search
    if (filters.query) {
      debug.log(`InfiniteScrollThoughts: Filtering by query: "${filters.query}"`);
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(thought =>
        thought.content.toLowerCase().includes(query) ||
        (thought.topic && thought.topic.toLowerCase().includes(query)) ||
        (thought.category && thought.category.toLowerCase().includes(query))
      );
    }

    // Mood filter
    if (filters.mood !== 'all') {
      debug.log(`InfiniteScrollThoughts: Filtering by mood: ${filters.mood}`);
      filtered = filtered.filter(thought => thought.mood === filters.mood);
    }

    // Category filter
    if (filters.category !== 'all') {
      debug.log(`InfiniteScrollThoughts: Filtering by category: ${filters.category}`);
      filtered = filtered.filter(thought => thought.category === filters.category);
    }

    // Source filter
    if (filters.source !== 'all') {
      debug.log(`InfiniteScrollThoughts: Filtering by source: ${filters.source}`);
      filtered = filtered.filter(thought => thought.source === filters.source);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      debug.log(`InfiniteScrollThoughts: Filtering by date range: ${filters.dateRange}`);
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(thought => 
        new Date(thought.timestamp) >= filterDate
      );
    }

    debug.log(`InfiniteScrollThoughts: Filtered to ${filtered.length} thoughts`);
    setFilteredThoughts(filtered);
  }, [thoughts, filters]);

  const handleFiltersChange = (newFilters: SearchFilters) => {
    debug.log('InfiniteScrollThoughts: Filters changed', newFilters);
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    debug.log('InfiniteScrollThoughts: Clearing filters');
    setFilters({
      query: '',
      mood: 'all',
      category: 'all',
      source: 'all',
      dateRange: 'all'
    });
  };

  const handleRefresh = async () => {
    debug.log('InfiniteScrollThoughts: Manual refresh requested');
    await loadThoughts(true);
  };

  return (
    <div className="space-y-8">
      {/* Search and Filter */}
      <SearchAndFilter
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClear={handleClearFilters}
      />

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <button 
            onClick={handleRefresh}
            className="mt-2 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="text-center">
        <p className="text-slate-600 dark:text-slate-400">
          Showing {filteredThoughts.length} of {thoughts.length} thoughts
        </p>
      </div>

      {/* Thoughts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredThoughts.map((thought, index) => (
          <div
            key={thought.id}
            style={{
              animationDelay: `${(index % 12) * 100}ms`
            }}
            className="animate-fade-in"
          >
            <ThoughtCard
              thought={thought}
              onFavoriteChange={onFavoriteChange}
              onRegenerate={onRegenerate}
              onExport={onExport}
            />
          </div>
        ))}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading more thoughts...</span>
          </div>
        </div>
      )}

      {/* End of Results */}
      {!loading && !hasMore && thoughts.length > 0 && (
        <div className="text-center py-8">
          <p className="text-slate-500 dark:text-slate-400">
            You've reached the end of your shower thoughts! 🚿
          </p>
        </div>
      )}

      {/* No Results */}
      {!loading && filteredThoughts.length === 0 && thoughts.length > 0 && (
        <div className="text-center py-12">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-8 max-w-md mx-auto">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
              No thoughts found
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Try adjusting your search criteria or filters.
            </p>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && thoughts.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-8 max-w-md mx-auto">
            <div className="text-6xl mb-4">💭</div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
              No thoughts yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Generate your first shower thought to see it here!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Memoize based on callback function references
  return (
    prevProps.onFavoriteChange === nextProps.onFavoriteChange &&
    prevProps.onRegenerate === nextProps.onRegenerate &&
    prevProps.onExport === nextProps.onExport
  );
});

export default InfiniteScrollThoughts;