import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// Performance monitoring
export function initPerformanceMonitoring() {
  // Core Web Vitals
  getCLS(console.log);
  getFID(console.log);
  getFCP(console.log);
  getLCP(console.log);
  getTTFB(console.log);

  // Custom performance marks
  performance.mark('app-start');
  
  // Monitor component render times
  if (process.env.NODE_ENV === 'development') {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes('component-')) {
          console.log(`${entry.name}: ${entry.duration}ms`);
        }
      });
    });
    observer.observe({ entryTypes: ['measure'] });
  }
}

// Performance measurement utilities
export function measureComponentRender(componentName: string, fn: () => void) {
  if (process.env.NODE_ENV === 'development') {
    const startMark = `${componentName}-start`;
    const endMark = `${componentName}-end`;
    const measureName = `component-${componentName}`;
    
    performance.mark(startMark);
    fn();
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);
  } else {
    fn();
  }
}

// Memory usage monitoring
export function monitorMemoryUsage() {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log({
      usedJSHeapSize: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      totalJSHeapSize: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      jsHeapSizeLimit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`
    });
  }
}

// Bundle size analyzer
export function analyzeBundleSize() {
  if (process.env.NODE_ENV === 'development') {
    import('rollup-plugin-visualizer').then(({ visualizer }) => {
      console.log('Bundle analysis available at /stats.html');
    });
  }
}

// Image loading optimization
export function preloadCriticalImages(urls: string[]) {
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}

// Resource hints
export function addResourceHints() {
  // DNS prefetch for external domains
  const domains = [
    'https://api.openai.com',
    'https://images.pexels.com'
  ];
  
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });
}