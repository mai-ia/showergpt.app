import React, { useState } from 'react';
import { Search, Filter, X, Calendar, Tag, Sparkles } from 'lucide-react';
import { SearchFilters } from '../types';
import { thoughtCategories } from '../data/categories';

interface SearchAndFilterProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClear: () => void;
  className?: string;
}

export default function SearchAndFilter({ 
  filters, 
  onFiltersChange, 
  onClear, 
  className = '' 
}: SearchAndFilterProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = filters.query || filters.mood !== 'all' || 
    filters.category !== 'all' || filters.source !== 'all' || filters.dateRange !== 'all';

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 ${className}`}>
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search thoughts..."
          value={filters.query}
          onChange={(e) => handleFilterChange('query', e.target.value)}
          className="w-full pl-10 pr-12 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 transition-all duration-300 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
        />
        {filters.query && (
          <button
            onClick={() => handleFilterChange('query', '')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filters.mood}
          onChange={(e) => handleFilterChange('mood', e.target.value)}
          className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
        >
          <option value="all">All Moods</option>
          <option value="philosophical">🤔 Philosophical</option>
          <option value="humorous">😄 Humorous</option>
          <option value="scientific">🔬 Scientific</option>
        </select>

        <select
          value={filters.source}
          onChange={(e) => handleFilterChange('source', e.target.value)}
          className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
        >
          <option value="all">All Sources</option>
          <option value="template">📝 Template</option>
          <option value="openai">✨ AI Generated</option>
        </select>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300
            ${showAdvanced 
              ? 'bg-blue-500 text-white' 
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }
          `}
        >
          <Filter className="w-4 h-4" />
          Advanced
        </button>

        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="all">All Categories</option>
                {thoughtCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}