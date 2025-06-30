import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { Droplets, Heart, Sparkles, Waves, History, Trash2, Download, User, LogIn, BarChart3, Grip, Zap, Users } from 'lucide-react';
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
import LegalDisclaimer from './components/LegalDisclaimer';
import PaymentPromptModal from './components/PaymentPromptModal';

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
import AppContent from './AppContent';
import Tooltip from './components/ui/Tooltip';
            <AppContent />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;