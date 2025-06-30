import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { Droplets, Heart, Sparkles, Waves, History, Trash2, Download, User, LogIn, BarChart3, Grip, Zap, Users, Database } from 'lucide-react';
import { ShowerThought, GenerationRequest } from './types';
import { generateShowerThought, generateVariation } from './utils/thoughtGenerator';
import { generateShowerThoughtWithAI, generateVariationWithAI, isOpenAIConfigured } from './services/openaiService';
import { saveThought, getUserThoughts, addToFavorites, removeFromFavorites, syncLocalDataToDatabase } from './services/thoughtsService';
import { checkRateLimit } from './utils/rateLimit';
import { addToHistory, getThoughtHistory, exportThoughts } from './utils/storage';
import { env } from './config/environment';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { initPerformanceMonitoring, measureComponentRender } from './utils/performance';
import { useCache } from './hooks/useCache';

// UI Components
import { ToastProvider, useToast } from './components/ui/Toast';
import SkipLink from './components/accessibility/SkipLink';

// Enhanced Components
import EnhancedInputSection from './components/enhanced/EnhancedInputSection';
import EnhancedThoughtCard from './components/enhanced/EnhancedThoughtCard';

// Optimized imports
import ErrorBoundary from './components/ErrorBoundary';
import EnvironmentWarning from './components/EnvironmentWarning';
import SupabaseWarning from './components/SupabaseWarning';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ThemeToggle from './components/ThemeToggle';
import CloudSyncIndicator from './components/CloudSyncIndicator';
import LoadingFallback, { ThoughtsListSkeleton, ModalSkeleton } from './components/LoadingFallback';
import Button from './components/ui/Button';
import Card from './components/ui/Card';
import Tooltip from './components/ui/Tooltip';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Database status checker
import DatabaseStatusChecker from './components/DatabaseStatusChecker';

// Lazy loaded components
import {
  LazyInfiniteScrollThoughts,
  LazySavedThoughts,
  LazyDragDropFavorites,
  LazyHistoryPanel,
  LazyAuthModal,
  LazyUserProfile,
  LazyUserStats,
  LazyResetPasswordForm,
  LazyLiveThoughtsFeed,
  LazyOnlineUsers,
  LazyLiveNotifications,
  LazyLiveCollaboration
} from './components/LazyComponents';

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  initPerformanceMonitoring();
}

function AppContent() {
  const { user, isConfigured: isAuthConfigured } = useAuth();
  const { success, error: showError } = useToast();
  const [thoughts, setThoughts] = useState<ShowerThought[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showSaved, setShowSaved] = useState(false);
  const [showDragDropFavorites, setShowDragDropFavorites] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showUserStats, setShowUserStats] = useState(false);
  const [showInfiniteScroll, setShowInfiniteScroll] = useState(false);
  const [showLiveFeed, setShowLiveFeed] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [savedThoughtsRefresh, setSavedThoughtsRefresh] = useState(0);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [showDatabaseStatus, setShowDatabaseStatus] = useState(false);

  // Cached user thoughts
  const { data: cachedThoughts, refresh: refreshThoughts } = useCache(
    `user-thoughts-${user?.id || 'anonymous'}`,
    () => getUserThoughts(user?.id, 10),
    { ttl: 2 * 60 * 1000 } // 2 minutes cache
  );

  // Check if this is a password reset page
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    if (type === 'recovery') {
      setIsPasswordReset(true);
    }
  }, []);

  // Update page title
  useEffect(() => {
    document.title = '🚿 ShowerGPT - Whimsical Shower Thoughts';
  }, []);

  // Load user's thoughts when they sign in with proper error handling
  useEffect(() => {
    if (user) {
      measureComponentRender('load-user-thoughts', async () => {
        try {
          await loadUserThoughts();
          await handleDataSync();
        } catch (error) {
          console.error('Error in user data loading:', error);
          showError('Data loading failed', 'Unable to load your thoughts. Please refresh the page.');
        }
      });
    }
  }, [user]);

  // Update thoughts from cache
  useEffect(() => {
    if (cachedThoughts) {
      setThoughts(cachedThoughts);
    }
  }, [cachedThoughts]);

  const loadUserThoughts = async () => {
    try {
      await refreshThoughts();
    } catch (error) {
      console.error('Error loading user thoughts:', error);
      throw error; // Re-throw to be caught by the effect
    }
  };

  const handleDataSync = async () => {
    try {
      const result = await syncLocalDataToDatabase(user?.id);
      if (result.thoughts > 0 || result.favorites > 0) {
        success(
          'Data synced successfully!',
          `Synced ${result.thoughts} thoughts and ${result.favorites} favorites to the cloud.`
        );
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      showError('Sync failed', 'Unable to sync your data to the cloud.');
    }
  };

  const handleGenerate = useCallback(async (request: GenerationRequest) => {
    setError('');
    
    // Check rate limit for template generation
    if (!request.useAI) {
      const rateCheck = checkRateLimit();
      if (!rateCheck.allowed) {
        const resetDate = new Date(rateCheck.resetTime!);
        const resetTime = resetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const errorMsg = `Rate limit exceeded. Try again after ${resetTime}.`;
        setError(errorMsg);
        showError('Rate limit exceeded', errorMsg);
        return;
      }
    }

    setIsLoading(true);
    
    try {
      let newThought: ShowerThought;
      
      if (request.useAI && isOpenAIConfigured()) {
        // Use OpenAI API
        newThought = await generateShowerThoughtWithAI(request);
        success(
          'AI thought generated!',
          'Your brilliant AI-powered shower thought is ready.'
        );
      } else {
        // Use template generation with simulated delay
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
        newThought = generateShowerThought(request);
        success(
          'Thought generated!',
          'Your brilliant shower thought is ready.'
        );
      }
      
      // Add category to thought
      if (request.category) {
        newThought.category = request.category;
      }
      
      // Save thought to database/local storage with proper error handling
      try {
        console.log('Saving new thought:', newThought);
        const savedThought = await saveThought(newThought, user?.id);
        console.log('Thought saved successfully:', savedThought);
        setThoughts(prev => [savedThought, ...prev]);
        refreshThoughts(); // Refresh cache
      } catch (saveError) {
        console.error('Error saving thought:', saveError);
        // Still show the thought even if save failed
        setThoughts(prev => [newThought, ...prev]);
        showError('Save failed', 'Thought generated but not saved to cloud.');
      }
      
      // Add to history (legacy support)
      addToHistory(newThought);
      setHistoryRefresh(prev => prev + 1);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to generate thought. Please try again.';
      setError(errorMsg);
      showError('Generation failed', errorMsg);
      console.error('Generation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, refreshThoughts, showError, success]);

  const handleRegenerate = useCallback(async (originalThought: ShowerThought) => {
    setError('');
    
    // Check if original thought was AI-generated
    const useAI = originalThought.source === 'openai';
    
    // Check rate limit for template generation
    if (!useAI) {
      const rateCheck = checkRateLimit();
      if (!rateCheck.allowed) {
        const resetDate = new Date(rateCheck.resetTime!);
        const resetTime = resetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const errorMsg = `Rate limit exceeded. Try again after ${resetTime}.`;
        setError(errorMsg);
        showError('Rate limit exceeded', errorMsg);
        return;
      }
    }

    setIsLoading(true);
    
    try {
      let variation: ShowerThought;
      
      if (useAI && isOpenAIConfigured()) {
        // Use OpenAI API for variation
        variation = await generateVariationWithAI(originalThought);
        success(
          'AI variation generated!',
          'A new AI-powered variation has been created.'
        );
      } else {
        // Use template generation with simulated delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));
        variation = generateVariation(originalThought);
        success(
          'Variation generated!',
          'A new variation of your thought has been created.'
        );
      }
      
      // Save variation to database/local storage with proper error handling
      try {
        console.log('Saving variation:', variation);
        const savedVariation = await saveThought(variation, user?.id);
        console.log('Variation saved successfully:', savedVariation);
        setThoughts(prev => [savedVariation, ...prev]);
        refreshThoughts(); // Refresh cache
      } catch (saveError) {
        console.error('Error saving variation:', saveError);
        // Still show the variation even if save failed
        setThoughts(prev => [variation, ...prev]);
        showError('Save failed', 'Variation generated but not saved to cloud.');
      }
      
      // Add to history (legacy support)
      addToHistory(variation);
      setHistoryRefresh(prev => prev + 1);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to generate variation. Please try again.';
      setError(errorMsg);
      showError('Variation failed', errorMsg);
      console.error('Regeneration error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, refreshThoughts, showError, success]);

  const handleFavoriteToggle = useCallback(async (thought: ShowerThought, isFavorite: boolean) => {
    try {
      console.log('Toggling favorite:', thought.id, isFavorite);
      if (isFavorite) {
        await addToFavorites(thought, user?.id);
        success('Added to favorites!', 'This thought has been saved to your favorites.');
      } else {
        await removeFromFavorites(thought.id, user?.id);
        success('Removed from favorites!', 'This thought has been removed from your favorites.');
      }
      setSavedThoughtsRefresh(prev => prev + 1);
      refreshThoughts(); // Refresh cache
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showError('Favorite failed', error.message || 'Unable to update favorite status.');
    }
  }, [user?.id, refreshThoughts, showError, success]);

  const handleClearAll = useCallback(() => {
    setThoughts([]);
    refreshThoughts(); // Refresh cache
    success('Thoughts cleared!', 'All thoughts have been removed from view.');
  }, [refreshThoughts, success]);

  const handleExportAll = useCallback(() => {
    try {
      if (thoughts.length === 0) {
        const errorMsg = 'No thoughts to export. Generate some thoughts first!';
        setError(errorMsg);
        showError('Export failed', errorMsg);
        return;
      }
      exportThoughts(thoughts, 'all-shower-thoughts');
      success('Export successful!', `${thoughts.length} thoughts have been exported.`);
    } catch (err) {
      const errorMsg = 'Failed to export thoughts. Please try again.';
      setError(errorMsg);
      showError('Export failed', errorMsg);
      console.error('Export error:', err);
    }
  }, [thoughts, showError, success]);

  const handleExportSingle = useCallback((thought: ShowerThought) => {
    try {
      exportThoughts([thought], `shower-thought-${thought.id}`);
    } catch (err) {
      showError('Export failed', 'Unable to export thought.');
      console.error('Export error:', err);
    }
  }, [showError]);

  const handlePasswordResetSuccess = () => {
    setIsPasswordReset(false);
    // Clear the hash from URL
    window.history.replaceState(null, '', window.location.pathname);
    success('Password updated!', 'Your password has been successfully updated.');
  };

  // Show password reset form if this is a password reset session
  if (isPasswordReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
        <Card variant="elevated" className="max-w-md w-full">
          <Suspense fallback={<LoadingFallback message="Loading password reset..." />}>
            <LazyResetPasswordForm onSuccess={handlePasswordResetSuccess} />
          </Suspense>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden transition-colors duration-300">
      <SkipLink />
      
      {/* Decorative water drops */}
      <div className="absolute top-10 left-10 text-blue-200 dark:text-blue-800 opacity-30 animate-float" style={{ animationDelay: '0s' }}>
        <Droplets className="w-8 h-8" />
      </div>
      <div className="absolute top-32 right-20 text-blue-300 dark:text-blue-700 opacity-40 animate-float" style={{ animationDelay: '1s' }}>
        <Droplets className="w-6 h-6" />
      </div>
      <div className="absolute top-64 left-1/4 text-blue-200 dark:text-blue-800 opacity-25 animate-float" style={{ animationDelay: '2s' }}>
        <Droplets className="w-5 h-5" />
      </div>

      {/* Header */}
      <header className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 shadow-xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-2xl shadow-lg animate-glow">
                <span className="text-4xl" role="img" aria-label="Shower emoji">🚿</span>
              </div>
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 tracking-tight">
                  ShowerGPT
                </h1>
                <p className="text-blue-100 dark:text-slate-300 text-lg font-medium">
                  Whimsical thoughts for your wandering mind
                </p>
                <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                  <Waves className="w-4 h-4 text-blue-200 dark:text-slate-400" />
                  <span className="text-blue-200 dark:text-slate-400 text-sm">
                    {isOpenAIConfigured() ? 'AI-powered brilliance' : 'Where brilliant ideas flow'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Live Notifications - Only render one instance */}
              {isAuthConfigured && user && (
                <Suspense fallback={<div className="w-12 h-12 bg-white bg-opacity-20 rounded-2xl animate-pulse"></div>}>
                  <LazyLiveNotifications />
                </Suspense>
              )}
              
              {/* Cloud Sync Indicator */}
              <CloudSyncIndicator />
              
              <Tooltip content="View live thoughts from all users">
                <Button
                  onClick={() => setShowLiveFeed(!showLiveFeed)}
                  variant={showLiveFeed ? 'primary' : 'ghost'}
                  size="md"
                  leftIcon={<Zap className="w-5 h-5" />}
                  className="text-white bg-white bg-opacity-20 hover:bg-opacity-30 border-white border-opacity-20"
                >
                  <span className="hidden sm:inline">Live Feed</span>
                </Button>
              </Tooltip>
              
              <Tooltip content="Join collaborative thinking sessions">
                <Button
                  onClick={() => setShowCollaboration(!showCollaboration)}
                  variant={showCollaboration ? 'primary' : 'ghost'}
                  size="md"
                  leftIcon={<Users className="w-5 h-5" />}
                  className="text-white bg-white bg-opacity-20 hover:bg-opacity-30 border-white border-opacity-20"
                >
                  <span className="hidden sm:inline">Collaborate</span>
                </Button>
              </Tooltip>
              
              <Tooltip content="View your thought history">
                <Button
                  onClick={() => setShowHistory(true)}
                  variant="ghost"
                  size="md"
                  leftIcon={<History className="w-5 h-5" />}
                  className="text-white bg-white bg-opacity-20 hover:bg-opacity-30 border-white border-opacity-20"
                >
                  <span className="hidden sm:inline">History</span>
                </Button>
              </Tooltip>
              
              <ProtectedRoute requireAuth={false}>
                <Tooltip content="View your favorite thoughts">
                  <Button
                    onClick={() => setShowSaved(true)}
                    variant="ghost"
                    size="md"
                    leftIcon={<Heart className="w-5 h-5" />}
                    className="text-white bg-white bg-opacity-20 hover:bg-opacity-30 border-white border-opacity-20"
                  >
                    <span className="hidden sm:inline">Favorites</span>
                  </Button>
                </Tooltip>
              </ProtectedRoute>

              {/* Drag & Drop Favorites */}
              <ProtectedRoute requireAuth={true} fallback={<></>}>
                <Tooltip content="Organize your favorite thoughts">
                  <Button
                    onClick={() => setShowDragDropFavorites(true)}
                    variant="ghost"
                    size="md"
                    leftIcon={<Grip className="w-5 h-5" />}
                    className="text-white bg-white bg-opacity-20 hover:bg-opacity-30 border-white border-opacity-20"
                  >
                    <span className="hidden sm:inline">Organize</span>
                  </Button>
                </Tooltip>
              </ProtectedRoute>
              
              {/* Stats Button (only for authenticated users) */}
              <ProtectedRoute requireAuth={true} fallback={<></>}>
                <Tooltip content="View your thinking statistics">
                  <Button
                    onClick={() => setShowUserStats(true)}
                    variant="ghost"
                    size="md"
                    leftIcon={<BarChart3 className="w-5 h-5" />}
                    className="text-white bg-white bg-opacity-20 hover:bg-opacity-30 border-white border-opacity-20"
                  >
                    <span className="hidden sm:inline">Stats</span>
                  </Button>
                </Tooltip>
              </ProtectedRoute>
              
              {/* Database Status Button */}
              <Tooltip content="Check database connection">
                <Button
                  onClick={() => setShowDatabaseStatus(!showDatabaseStatus)}
                  variant="ghost"
                  size="md"
                  leftIcon={<Database className="w-5 h-5" />}
                  className="text-white bg-white bg-opacity-20 hover:bg-opacity-30 border-white border-opacity-20"
                >
                  <span className="hidden sm:inline">Database</span>
                </Button>
              </Tooltip>
              
              {/* Auth Button */}
              {isAuthConfigured && (
                <Tooltip content={user ? 'View your profile' : 'Sign in to save thoughts'}>
                  <Button
                    onClick={() => user ? setShowUserProfile(true) : setShowAuthModal(true)}
                    variant="ghost"
                    size="md"
                    leftIcon={user ? <User className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                    className="text-white bg-white bg-opacity-20 hover:bg-opacity-30 border-white border-opacity-20"
                  >
                    <span className="hidden sm:inline">
                      {user ? 'Profile' : 'Sign In'}
                    </span>
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
        
        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-8 fill-current text-blue-50 dark:text-slate-800">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
          </svg>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8">
            {/* Environment Warnings */}
            <EnvironmentWarning />
            <SupabaseWarning />
            
            {/* Database Status Checker */}
            {showDatabaseStatus && <DatabaseStatusChecker />}

            {/* Live Features */}
            {showLiveFeed && (
              <div className="mb-8">
                <Suspense fallback={<LoadingFallback message="Loading live feed..." />}>
                  <LazyLiveThoughtsFeed onThoughtUpdate={(thought) => {
                    // Update local thoughts if needed
                    setThoughts(prev => 
                      prev.map(t => t.id === thought.id ? thought : t)
                    );
                  }} />
                </Suspense>
              </div>
            )}

            {showCollaboration && (
              <div className="mb-8">
                <Suspense fallback={<LoadingFallback message="Loading collaboration..." />}>
                  <LazyLiveCollaboration />
                </Suspense>
              </div>
            )}

            <EnhancedInputSection
              onGenerate={handleGenerate}
              isLoading={isLoading}
              error={error}
            />

            {/* Loading State */}
            {isLoading && (
              <Card variant="elevated" className="text-center">
                <div className="flex flex-col items-center gap-6 py-8">
                  <LoadingSpinner variant="shower" size="xl" />
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                      Generating brilliant thoughts...
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Let the shower wisdom flow through you
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </Card>
            )}

            {/* View Toggle */}
            <div className="flex justify-center mb-8">
              <Card variant="glass" padding="sm">
                <div className="flex">
                  <Button
                    onClick={() => setShowInfiniteScroll(false)}
                    variant={!showInfiniteScroll ? 'primary' : 'ghost'}
                    size="md"
                    className="rounded-r-none"
                  >
                    Recent Thoughts
                  </Button>
                  <Button
                    onClick={() => setShowInfiniteScroll(true)}
                    variant={showInfiniteScroll ? 'primary' : 'ghost'}
                    size="md"
                    className="rounded-l-none"
                  >
                    Browse All
                  </Button>
                </div>
              </Card>
            </div>

            {/* Thoughts Section */}
            <section>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-2xl shadow-lg">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                      {showInfiniteScroll ? 'All Thoughts' : 'Recent Thoughts'}
                    </h2>
                    {!showInfiniteScroll && thoughts.length > 0 && (
                      <p className="text-slate-600 dark:text-slate-400 mt-1">
                        {thoughts.length} brilliant {thoughts.length === 1 ? 'thought' : 'thoughts'} and counting
                      </p>
                    )}
                  </div>
                </div>
                
                {!showInfiniteScroll && thoughts.length > 0 && (
                  <div className="flex items-center gap-3">
                    <Tooltip content="Export all thoughts as a text file">
                      <Button
                        onClick={handleExportAll}
                        variant="secondary"
                        size="md"
                        leftIcon={<Download className="w-5 h-5" />}
                        className="bg-green-500 hover:bg-green-600 text-white border-green-500"
                      >
                        <span className="hidden sm:inline">Export All</span>
                      </Button>
                    </Tooltip>
                    <Tooltip content="Clear all thoughts from view">
                      <Button
                        onClick={handleClearAll}
                        variant="danger"
                        size="md"
                        leftIcon={<Trash2 className="w-5 h-5" />}
                      >
                        <span className="hidden sm:inline">Clear All</span>
                      </Button>
                    </Tooltip>
                  </div>
                )}
              </div>
              
              <Suspense fallback={<ThoughtsListSkeleton />}>
                {showInfiniteScroll ? (
                  <LazyInfiniteScrollThoughts
                    onFavoriteChange={handleFavoriteToggle}
                    onRegenerate={handleRegenerate}
                    onExport={handleExportSingle}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {thoughts.length === 0 ? (
                      <div className="col-span-full text-center py-20">
                        <Card variant="elevated" className="max-w-md mx-auto">
                          <div className="mb-6">
                            <div className="bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                              <Droplets className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">
                            No thoughts yet
                          </h3>
                          <p className="text-slate-600 dark:text-slate-400 text-lg">
                            Generate your first shower thought above and let the wisdom flow! 🚿
                          </p>
                        </Card>
                      </div>
                    ) : (
                      thoughts.map((thought, index) => (
                        <EnhancedThoughtCard
                          key={thought.id}
                          thought={thought}
                          onFavoriteChange={handleFavoriteToggle}
                          onRegenerate={handleRegenerate}
                          onExport={handleExportSingle}
                          index={index}
                        />
                      ))
                    )}
                  </div>
                )}
              </Suspense>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Suspense fallback={<LoadingFallback size="sm" message="Loading online users..." />}>
              <LazyOnlineUsers />
            </Suspense>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 border-t border-blue-100 dark:border-slate-700 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Droplets className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                Crafted with 💧 for moments of contemplation
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
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
        <Suspense fallback={<ModalSkeleton />}>
          <LazySavedThoughts
            onClose={() => setShowSaved(false)}
            refreshTrigger={savedThoughtsRefresh}
          />
        </Suspense>
      )}

      {showDragDropFavorites && (
        <Suspense fallback={<ModalSkeleton />}>
          <LazyDragDropFavorites
            onClose={() => setShowDragDropFavorites(false)}
            refreshTrigger={savedThoughtsRefresh}
          />
        </Suspense>
      )}

      {showHistory && (
        <Suspense fallback={<ModalSkeleton />}>
          <LazyHistoryPanel
            onClose={() => setShowHistory(false)}
            onRegenerate={handleRegenerate}
            refreshTrigger={historyRefresh}
          />
        </Suspense>
      )}

      {showAuthModal && (
        <Suspense fallback={<ModalSkeleton />}>
          <LazyAuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
          />
        </Suspense>
      )}

      {showUserProfile && (
        <Suspense fallback={<ModalSkeleton />}>
          <LazyUserProfile
            isOpen={showUserProfile}
            onClose={() => setShowUserProfile(false)}
          />
        </Suspense>
      )}

      {showUserStats && (
        <Suspense fallback={<ModalSkeleton />}>
          <LazyUserStats
            isOpen={showUserStats}
            onClose={() => setShowUserStats(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;