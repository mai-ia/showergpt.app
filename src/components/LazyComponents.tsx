import { lazy } from 'react';

// Lazy load heavy components
export const LazyThoughtsList = lazy(() => import('./ThoughtsList'));
export const LazyInfiniteScrollThoughts = lazy(() => import('./InfiniteScrollThoughts'));
export const LazySavedThoughts = lazy(() => import('./SavedThoughts'));
export const LazyDragDropFavorites = lazy(() => import('./DragDropFavorites'));
export const LazyHistoryPanel = lazy(() => import('./HistoryPanel'));
export const LazyUserProfile = lazy(() => import('./auth/UserProfile'));
export const LazyUserStats = lazy(() => import('./UserStats'));
export const LazyShareableThoughtCard = lazy(() => import('./ShareableThoughtCard'));

// Lazy load realtime components
export const LazyLiveThoughtsFeed = lazy(() => import('./realtime/LiveThoughtsFeed'));
export const LazyLiveNotifications = lazy(() => import('./realtime/LiveNotifications'));
export const LazyLiveComments = lazy(() => import('./realtime/LiveComments'));
export const LazyLiveCollaboration = lazy(() => import('./realtime/LiveCollaboration'));
export const LazyOnlineUsers = lazy(() => import('./realtime/OnlineUsers'));

// Lazy load auth components
export const LazyAuthModal = lazy(() => import('./auth/AuthModal'));
export const LazyResetPasswordForm = lazy(() => import('./auth/ResetPasswordForm'));