import React, { useState, useEffect, memo } from 'react';
import { History, X, Trash2, Download, Search, Filter } from 'lucide-react';
import { ShowerThought } from '../types';
import { getThoughtHistory, clearHistory, exportThoughts } from '../utils/storage';
import ThoughtCard from './ThoughtCard';

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

  useEffect(() => {
    loadHistory();
  }, [refreshTrigger]);

  useEffect(() => {
    filterHistory();
  }, [history, searchTerm, moodFilter]);

  const loadHistory = () => {
    const historyData = getThoughtHistory();
    setHistory(historyData);
  };

  const filterHistory = () => {
    let filtered = history;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(thought =>
        thought.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (thought.topic && thought.topic.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by mood
    if (moodFilter !== 'all') {
      filtered = filtered.filter(thought => thought.mood === moodFilter);
    }

    setFilteredHistory(filtered);
  };

  const handleClearHistory = () => {
    try {
      clearHistory();
      setHistory([]);
      setShowConfirmClear(false);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const handleExportHistory = () => {
    try {
      exportThoughts(filteredHistory, 'shower-thoughts-history');
    } catch (error) {
      console.error('Error exporting history:', error);
    }
  };

  const handleExportSingle = (thought: ShowerThought) => {
    try {
      exportThoughts([thought], `shower-thought-${thought.id}`);
    } catch (error) {
      console.error('Error exporting thought:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden border border-blue-200">
        <div className="flex items-center justify-between p-8 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-2xl shadow-lg">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Thought History
              </h2>
              <p className="text-slate-600 mt-1">
                {filteredHistory.length} of {history.length} thoughts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {history.length > 0 && (
              <>
                <button
                  onClick={handleExportHistory}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button
                  onClick={() => setShowConfirmClear(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-3 rounded-2xl bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {history.length > 0 && (
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search thoughts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 transition-all duration-300 outline-none"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <select
                  value={moodFilter}
                  onChange={(e) => setMoodFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 transition-all duration-300 outline-none bg-white"
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
          {filteredHistory.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-8 rounded-3xl max-w-md mx-auto">
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                    <History className="w-12 h-12 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">
                  {history.length === 0 ? 'No history yet' : 'No matching thoughts'}
                </h3>
                <p className="text-slate-600 text-lg">
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
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border border-red-200">
            <div className="text-center">
              <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">Clear History?</h3>
              <p className="text-slate-600 mb-6">
                This will permanently delete all {history.length} thoughts from your history. This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-2xl hover:bg-slate-300 transition-all duration-300 font-semibold"
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