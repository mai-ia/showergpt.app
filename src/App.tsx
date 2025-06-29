import React, { useState, useEffect } from 'react';
import { Droplets, Heart, Sparkles, Waves, History, Trash2, Download, User, LogIn, BarChart3 } from 'lucide-react';
import { ShowerThought, GenerationRequest } from './types';
import { generateShowerThought, generateVariation } from './utils/thoughtGenerator';
import { generateShowerThoughtWithAI, generateVariationWithAI, isOpenAIConfigured } from './services/openaiService';
import { saveThought, getUserThoughts, addToFavorites, removeFromFavorites } from './services/thoughtsService';
import { checkRateLimit } from './utils/rateLimit';
import { addToHistory, getThoughtHistory, exportThoughts } from './utils/storage';
import { env } from './config/environment';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import InputSection from './components/InputSection';
import ThoughtsList from './components/ThoughtsList';
import SavedThoughts from './components/SavedThoughts';
import HistoryPanel from './components/HistoryPanel';
import ErrorBoundary from './components/ErrorBoundary';
import EnvironmentWarning from './components/EnvironmentWarning';
import SupabaseWarning from './components/SupabaseWarning';
import AuthModal from './components/auth/AuthModal';
import UserProfile from './components/auth/UserProfile';
import CloudSyncIndicator from './components/CloudSyncIndicator';
import UserStats from './components/UserStats';

function AppContent() {
  const { user, isConfigured: isAuthConfigured } = useAuth();
  const [thoughts, setThoughts] = useState<ShowerThought[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showSaved, setShowSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showUserStats, setShowUserStats] = useState(false);
  const [savedThoughtsRefresh, setSavedThoughtsRefresh] = useState(0);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  // Update page title
  useEffect(() => {
    document.title = '🚿 ShowerGPT - Whimsical Shower Thoughts';
  }, []);

  // Load user's thoughts when they sign in
  useEffect(() => {
    if (user) {
      loadUserThoughts();
    }
  }, [user]);

  const loadUserThoughts = async () => {
    try {
      const userThoughts = await getUserThoughts(user?.id, 10); // Load recent thoughts
      setThoughts(userThoughts);
    } catch (error) {
      console.error('Error loading user thoughts:', error);
    }
  };

  const handleGenerate = async (request: GenerationRequest) => {
    setError('');
    
    // Check rate limit for template generation
    if (!request.useAI) {
      const rateCheck = checkRateLimit();
      if (!rateCheck.allowed) {
        const resetDate = new Date(rateCheck.resetTime!);
        const resetTime = resetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setError(`Rate limit exceeded. Try again after ${resetTime}.`);
        return;
      }
    }

    setIsLoading(true);
    
    try {
      let newThought: ShowerThought;
      
      if (request.useAI && isOpenAIConfigured()) {
        // Use OpenAI API
        newThought = await generateShowerThoughtWithAI(request);
      } else {
        // Use template generation with simulated delay
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
        newThought = generateShowerThought(request);
      }
      
      // Save thought to database/local storage
      try {
        const savedThought = await saveThought(newThought, user?.id);
        setThoughts(prev => [savedThought, ...prev]);
      } catch (saveError) {
        console.error('Error saving thought:', saveError);
        // Still show the thought even if save failed
        setThoughts(prev => [newThought, ...prev]);
      }
      
      // Add to history (legacy support)
      addToHistory(newThought);
      setHistoryRefresh(prev => prev + 1);
    } catch (err: any) {
      setError(err.message || 'Failed to generate thought. Please try again.');
      console.error('Generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async (originalThought: ShowerThought) => {
    setError('');
    
    // Check if original thought was AI-generated
    const useAI = originalThought.source === 'openai';
    
    // Check rate limit for template generation
    if (!useAI) {
      const rateCheck = checkRateLimit();
      if (!rateCheck.allowed) {
        const resetDate = new Date(rateCheck.resetTime!);
        const resetTime = resetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setError(`Rate limit exceeded. Try again after ${resetTime}.`);
        return;
      }
    }

    setIsLoading(true);
    
    try {
      let variation: ShowerThought;
      
      if (useAI && isOpenAIConfigured()) {
        // Use OpenAI API for variation
        variation = await generateVariationWithAI(originalThought);
      } else {
        // Use template generation with simulated delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));
        variation = generateVariation(originalThought);
      }
      
      // Save variation to database/local storage
      try {
        const savedVariation = await saveThought(variation, user?.id);
        setThoughts(prev => [savedVariation, ...prev]);
      } catch (saveError) {
        console.error('Error saving variation:', saveError);
        // Still show the variation even if save failed
        setThoughts(prev => [variation, ...prev]);
      }
      
      // Add to history (legacy support)
      addToHistory(variation);
      setHistoryRefresh(prev => prev + 1);
    } catch (err: any) {
      setError(err.message || 'Failed to generate variation. Please try again.');
      console.error('Regeneration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavoriteToggle = async (thought: ShowerThought, isFavorite: boolean) => {
    try {
      if (isFavorite) {
        await addToFavorites(thought, user?.id);
      } else {
        await removeFromFavorites(thought.id, user?.id);
      }
      setSavedThoughtsRefresh(prev => prev + 1);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setError('Failed to update favorite. Please try again.');
    }
  };

  const handleClearAll = () => {
    setThoughts([]);
  };

  const handleExportAll = () => {
    try {
      if (thoughts.length === 0) {
        setError('No thoughts to export. Generate some thoughts first!');
        return;
      }
      exportThoughts(thoughts, 'all-shower-thoughts');
    } catch (err) {
      setError('Failed to export thoughts. Please try again.');
      console.error('Export error:', err);
    }
  };

  const handleExportSingle = (thought: ShowerThought) => {
    try {
      exportThoughts([thought], `shower-thought-${thought.id}`);
    } catch (err) {
      setError('Failed to export thought. Please try again.');
      console.error('Export error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden">
      {/* Decorative water drops */}
      <div className="absolute top-10 left-10 text-blue-200 opacity-30 animate-bounce" style={{ animationDelay: '0s' }}>
        <Droplets className="w-8 h-8" />
      </div>
      <div className="absolute top-32 right-20 text-blue-300 opacity-40 animate-bounce" style={{ animationDelay: '1s' }}>
        <Droplets className="w-6 h-6" />
      </div>
      <div className="absolute top-64 left-1/4 text-blue-200 opacity-25 animate-bounce" style={{ animationDelay: '2s' }}>
        <Droplets className="w-5 h-5" />
      </div>

      {/* Header */}
      <header className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
                <span className="text-4xl">🚿</span>
              </div>
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 tracking-tight">
                  ShowerGPT
                </h1>
                <p className="text-blue-100 text-lg font-medium">
                  Whimsical thoughts for your wandering mind
                </p>
                <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                  <Waves className="w-4 h-4 text-blue-200" />
                  <span className="text-blue-200 text-sm">
                    {isOpenAIConfigured() ? 'AI-powered brilliance' : 'Where brilliant ideas flow'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Cloud Sync Indicator */}
              <CloudSyncIndicator />
              
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-3 px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-2xl hover:bg-opacity-30 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <History className="w-5 h-5" />
                <span className="font-semibold hidden sm:inline">History</span>
              </button>
              <button
                onClick={() => setShowSaved(true)}
                className="flex items-center gap-3 px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-2xl hover:bg-opacity-30 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Heart className="w-5 h-5" />
                <span className="font-semibold hidden sm:inline">Favorites</span>
              </button>
              
              {/* Stats Button (only for authenticated users) */}
              {user && (
                <button
                  onClick={() => setShowUserStats(true)}
                  className="flex items-center gap-3 px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-2xl hover:bg-opacity-30 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="font-semibold hidden sm:inline">Stats</span>
                </button>
              )}
              
              {/* Auth Button */}
              {isAuthConfigured && (
                <button
                  onClick={() => user ? setShowUserProfile(true) : setShowAuthModal(true)}
                  className="flex items-center gap-3 px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-2xl hover:bg-opacity-30 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {user ? <User className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                  <span className="font-semibold hidden sm:inline">
                    {user ? 'Profile' : 'Sign In'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-8 fill-current text-blue-50">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
          </svg>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Environment Warnings */}
        <EnvironmentWarning />
        <SupabaseWarning />

        <InputSection
          onGenerate={handleGenerate}
          isLoading={isLoading}
          error={error}
        />

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-3xl shadow-2xl p-12 mb-12 border border-blue-100 text-center">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Droplets className="w-6 h-6 text-blue-600 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-800">Generating brilliant thoughts...</h3>
                <p className="text-slate-600">Let the shower wisdom flow through you</p>
              </div>
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Thoughts Section */}
        <section>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-2xl shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-800">
                  Generated Thoughts
                </h2>
                {thoughts.length > 0 && (
                  <p className="text-slate-600 mt-1">
                    {thoughts.length} brilliant {thoughts.length === 1 ? 'thought' : 'thoughts'} and counting
                  </p>
                )}
              </div>
            </div>
            
            {thoughts.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportAll}
                  className="flex items-center gap-2 px-5 py-3 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                >
                  <Download className="w-5 h-5" />
                  <span className="hidden sm:inline">Export All</span>
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-2 px-5 py-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="hidden sm:inline">Clear All</span>
                </button>
              </div>
            )}
          </div>
          
          <ThoughtsList
            thoughts={thoughts}
            onFavoriteChange={(thought, isFavorite) => handleFavoriteToggle(thought, isFavorite)}
            onRegenerate={handleRegenerate}
            onExport={handleExportSingle}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="relative bg-gradient-to-r from-slate-50 to-blue-50 border-t border-blue-100 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Droplets className="w-5 h-5 text-blue-500" />
              <span className="text-slate-700 font-medium">
                Crafted with 💧 for moments of contemplation
              </span>
            </div>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {isOpenAIConfigured() 
                ? 'AI-powered thoughts with rate limiting for optimal creativity and cost control.'
                : 'Rate limited to 5 thoughts per minute for optimal shower-like pacing.'
              }
              <br />
              Because the best ideas need time to marinate.
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showSaved && (
        <SavedThoughts
          onClose={() => setShowSaved(false)}
          refreshTrigger={savedThoughtsRefresh}
        />
      )}

      {showHistory && (
        <HistoryPanel
          onClose={() => setShowHistory(false)}
          onRegenerate={handleRegenerate}
          refreshTrigger={historyRefresh}
        />
      )}

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {showUserProfile && (
        <UserProfile
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
        />
      )}

      {showUserStats && (
        <UserStats
          isOpen={showUserStats}
          onClose={() => setShowUserStats(false)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;