import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/mobile.css';
import { initPerformanceMonitoring, addResourceHints } from './utils/performance';
import { initMobileOptimizations } from './utils/mobileOptimizations';

// Initialize performance monitoring
initPerformanceMonitoring();

// Add resource hints for better performance
addResourceHints();

// Initialize mobile optimizations
initMobileOptimizations();

// Preload critical resources
const criticalImages = [
  // Add any critical images here
];

if (criticalImages.length > 0) {
  import('./utils/performance').then(({ preloadCriticalImages }) => {
    preloadCriticalImages(criticalImages);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);