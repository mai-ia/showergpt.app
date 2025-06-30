import React, { useState, useEffect, memo } from 'react';
import { History, X, Trash2, Download, Search, Filter, RefreshCw } from 'lucide-react';
import { ShowerThought } from '../types';
import { getThoughtHistory, clearHistory, exportThoughts } from '../utils/storage';
import ThoughtCard from './ThoughtCard';
import { debug } from '../utils/debugHelpers';
import Button from './ui/Button';

interface HistoryPanelProps {
  onClose: () => void;
  onRegenerate?: (thought: ShowerThought) => void;
  refreshTrigger: number;
}

const HistoryPanel = memo(function HistoryPanel({ onClose, onRegenerate, refreshTrigger }: HistoryPanelProps) {
  const [history, setHistory] = useState<ShowerThought[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ShowerThought[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [moodFilter, setMoodFilter] = useState<string>('all');
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [refreshTrigger]);

  useEffect(() => {
    filterHistory();
  }, [history, searchTerm, moodFilter]);

  const loadHistory = () => {
    debug.log('HistoryPanel: Loading history');
    setIsLoading(true);
    setError(null);
    
    try {
      const historyData = getThoughtHistory();
      debug.log(`HistoryPanel: Loaded ${historyData.length} thoughts from history`);
      setHistory(historyData);
    } catch (err) {
      debug.error('HistoryPanel: Error loading history:', err);
      setError('Failed to load history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterHistory = () => {
    debug.log('HistoryPanel: Filtering history');
    let filtered = history;

    // Filter by search term
    if (searchTerm) {
      debug.log(`HistoryPanel: Filtering by search term: "${searchTerm}"`);
      filtered = filtered.filter(thought =>
        thought.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (thought.topic && thought.topic.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by mood
    if (moodFilter !== 'all') {
      debug.log(`HistoryPanel: Filtering by mood: ${moodFilter}`);
      filtered = filtered.filter(thought => thought.mood === moodFilter);
    }

    debug.log(`HistoryPanel: Filtered to ${filtered.length} thoughts`);
    setFilteredHistory(filtered);
  };

  const handleClearHistory = () => {
    debug.log('HistoryPanel: Clearing history');
    try {
      clearHistory();
      setHistory([]);
      setShowConfirmClear(false);
      debug.log('HistoryPanel: History cleared successfully');
    } catch (err) {
      debug.error('HistoryPanel: Error clearing history:', err);
      setError('Failed to clear history. Please try again.');
    }
  };

  const handleExportHistory = () => {
    debug.log('HistoryPanel: Exporting history');
    try {
      exportThoughts(filteredHistory, 'shower-thoughts-history');
      debug.log('HistoryPanel: History exported successfully');
    } catch (err) {
      debug.error('HistoryPanel: Error exporting history:', err);
      setError('Failed to export history. Please try again.');
    }
  };

  const handleExportSingle = (thought: ShowerThought) => {
    debug.log(`HistoryPanel: Exporting single thought: ${thought.id}`);
    try {
      exportThoughts([thought], `shower-thought-${thought.id}`);
      debug.log('HistoryPanel: Thought exported successfully');
    } catch (err) {
      debug.error('HistoryPanel: Error exporting thought:', err);
      setError('Failed to export thought. Please try again.');
    }
  };

  const handleRefresh = () => {
    debug.log('HistoryPanel: Manual refresh requested');
    loadHistory();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden border border-blue-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-8 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-2xl shadow-lg">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                Thought History
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {filteredHistory.length} of {history.length} thoughts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {history.length > 0 && (
              <>
                <Button
                  onClick={handleRefresh}
                  variant="secondary"
                  size="md"
                  leftIcon={isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  disabled={isLoading}
                >
                  {isLoading ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button
                  onClick={handleExportHistory}
                  variant="secondary"
                  size="md"
                  leftIcon={<Download className="w-4 h-4" />}
                  className="bg-green-500 hover:bg-green-600 text-white border-green-500"
                >
                  <span className="hidden sm:inline">Export</span>
                </Button>
                <Button
                  onClick={() => setShowConfirmClear(true)}
                  variant="danger"
                  size="md"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-3 rounded-2xl bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 m-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-red-700 dark:text-red-400">{error}</p>
            <button 
              onClick={handleRefresh}
              className="mt-2 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {history.length > 0 && (
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search thoughts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 transition-all duration-300 outline-none"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <select
                  value={moodFilter}
                  onChange={(e) => setMoodFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 transition-all duration-300 outline-none bg-white dark:bg-slate-700"
                >
                  <option value="all">All Moods</option>
                  <option value="philosophical">🤔 Philosophical</option>
                  <option value="humorous">😄 Humorous</option>
                  <option value="scientific">🔬 Scientific</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoading && history.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading your thought history...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-8 rounded-3xl max-w-md mx-auto">
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-700 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                    <History className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">
                  {history.length === 0 ? 'No history yet' : 'No matching thoughts'}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  {history.length === 0 
                    ? 'Generate your first shower thought to see it here! 💭'
                    : 'Try adjusting your search or filter criteria.'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredHistory.map((thought, index) => (
                <div
                  key={thought.id}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <ThoughtCard
                    thought={thought}
                    onRegenerate={onRegenerate}
                    onExport={handleExportSingle}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Clear Dialog */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-60">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-md w-full border border-red-200 dark:border-red-700">
            <div className="text-center">
              <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">Clear History?</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                This will permanently delete all {history.length} thoughts from your history. This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all duration-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearHistory}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-all duration-300 font-semibold"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if refreshTrigger changes
  return (
    prevProps.refreshTrigger === nextProps.refreshTrigger &&
    prevProps.onRegenerate === nextProps.onRegenerate
  );
});

export default HistoryPanel;