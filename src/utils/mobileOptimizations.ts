// Mobile performance and optimization utilities

export class MobileOptimizer {
  private static instance: MobileOptimizer;
  private intersectionObserver: IntersectionObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;

  static getInstance(): MobileOptimizer {
    if (!MobileOptimizer.instance) {
      MobileOptimizer.instance = new MobileOptimizer();
    }
    return MobileOptimizer.instance;
  }

  // Initialize mobile optimizations
  init() {
    this.setupViewportMeta();
    this.setupIntersectionObserver();
    this.setupResizeObserver();
    this.setupTouchOptimizations();
    this.setupPerformanceOptimizations();
  }

  // Set up proper viewport meta tag
  private setupViewportMeta() {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }
    
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover'
    );
  }

  // Set up intersection observer for lazy loading
  private setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const element = entry.target as HTMLElement;
              
              // Trigger lazy loading
              if (element.dataset.src) {
                const img = element as HTMLImageElement;
                img.src = element.dataset.src;
                img.classList.add('loaded');
                this.intersectionObserver?.unobserve(element);
              }
              
              // Trigger animations
              if (element.classList.contains('animate-on-scroll')) {
                element.classList.add('mobile-fade-in');
                this.intersectionObserver?.unobserve(element);
              }
            }
          });
        },
        {
          rootMargin: '50px',
          threshold: 0.1
        }
      );
    }
  }

  // Set up resize observer for responsive adjustments
  private setupResizeObserver() {
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;
          
          // Adjust grid layouts based on container size
          if (element.classList.contains('responsive-grid')) {
            const width = entry.contentRect.width;
            const columns = width < 480 ? 1 : width < 768 ? 2 : 3;
            element.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
          }
        });
      });
    }
  }

  // Set up touch optimizations
  private setupTouchOptimizations() {
    // Prevent double-tap zoom on buttons
    document.addEventListener('touchend', (e) => {
      const target = e.target as HTMLElement;
      if (target.matches('button, [role="button"], input[type="button"], input[type="submit"]')) {
        e.preventDefault();
      }
    });

    // Add touch-friendly classes
    document.body.classList.add('touch-device');
    
    // Set up passive event listeners for better scroll performance
    document.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('touchmove', () => {}, { passive: true });
  }

  // Set up performance optimizations
  private setupPerformanceOptimizations() {
    // Preload critical resources
    this.preloadCriticalResources();
    
    // Set up resource hints
    this.addResourceHints();
    
    // Optimize images
    this.optimizeImages();
    
    // Service worker registration disabled for StackBlitz compatibility
    // this.registerServiceWorker();
  }

  // Preload critical resources
  private preloadCriticalResources() {
    const criticalFonts = [
      '/fonts/inter-var.woff2'
    ];

    criticalFonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = font;
      document.head.appendChild(link);
    });
  }

  // Add resource hints for better performance
  private addResourceHints() {
    const domains = [
      'https://images.pexels.com',
      'https://api.openai.com'
    ];

    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      document.head.appendChild(link);
    });
  }

  // Optimize images for mobile
  private optimizeImages() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      if (this.intersectionObserver) {
        this.intersectionObserver.observe(img);
      }
    });
  }

  // Service worker registration disabled for StackBlitz compatibility
  // private registerServiceWorker() {
  //   if ('serviceWorker' in navigator) {
  //     navigator.serviceWorker.register('/sw.js').catch(console.error);
  //   }
  // }

  // Observe element for lazy loading
  observeElement(element: HTMLElement) {
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(element);
    }
  }

  // Observe element for responsive behavior
  observeResize(element: HTMLElement) {
    if (this.resizeObserver) {
      this.resizeObserver.observe(element);
    }
  }

  // Get device capabilities
  getDeviceCapabilities() {
    return {
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isTouch: 'ontouchstart' in window,
      hasHover: window.matchMedia('(hover: hover)').matches,
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      supportsWebP: this.supportsWebP(),
      devicePixelRatio: window.devicePixelRatio || 1,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      connectionType: this.getConnectionType()
    };
  }

  // Check WebP support
  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  // Get connection type for adaptive loading
  private getConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.effectiveType || 'unknown';
  }

  // Adaptive image loading based on connection
  getOptimalImageSize(baseWidth: number): number {
    const capabilities = this.getDeviceCapabilities();
    const { connectionType, devicePixelRatio, viewportWidth } = capabilities;

    let multiplier = 1;

    // Adjust for device pixel ratio
    multiplier *= Math.min(devicePixelRatio, 2);

    // Adjust for connection speed
    switch (connectionType) {
      case 'slow-2g':
      case '2g':
        multiplier *= 0.5;
        break;
      case '3g':
        multiplier *= 0.75;
        break;
      case '4g':
      default:
        multiplier *= 1;
        break;
    }

    // Ensure we don't exceed viewport width
    const maxWidth = Math.min(baseWidth * multiplier, viewportWidth);
    
    return Math.round(maxWidth);
  }

  // Clean up observers
  destroy() {
    this.intersectionObserver?.disconnect();
    this.resizeObserver?.disconnect();
  }
}

// Utility functions for mobile optimization
export const mobileUtils = {
  // Check if device is mobile
  isMobile(): boolean {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  // Check if device supports touch
  isTouch(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  // Get safe area insets
  getSafeAreaInsets() {
    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
      right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
      bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
      left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0')
    };
  },

  // Debounce function for performance
  debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    }) as T;
  },

  // Throttle function for scroll events
  throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  },

  // Format file size for mobile display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  // Generate responsive image URLs
  generateResponsiveImageUrl(baseUrl: string, width: number): string {
    if (baseUrl.includes('pexels.com')) {
      return `${baseUrl}?auto=compress&cs=tinysrgb&w=${width}&dpr=${window.devicePixelRatio || 1}`;
    }
    return baseUrl;
  },

  // Check if element is in viewport
  isInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  // Smooth scroll to element
  scrollToElement(element: HTMLElement, offset: number = 0) {
    const elementPosition = element.offsetTop - offset;
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    });
  },

  // Copy text to clipboard with fallback
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const result = document.execCommand('copy');
        document.body.removeChild(textArea);
        return result;
      }
    } catch (error) {
      console.error('Failed to copy text:', error);
      return false;
    }
  }
};

// Initialize mobile optimizations
export function initMobileOptimizations() {
  const optimizer = MobileOptimizer.getInstance();
  optimizer.init();
  
  // Add mobile-specific CSS classes
  if (mobileUtils.isMobile()) {
    document.body.classList.add('mobile-device');
  }
  
  if (mobileUtils.isTouch()) {
    document.body.classList.add('touch-device');
  }
  
  // Set up viewport height CSS custom property
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  setVH();
  window.addEventListener('resize', mobileUtils.throttle(setVH, 100));
  
  return optimizer;
}