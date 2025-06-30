import React, { useState, useRef, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

interface MobileProgressiveImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export default function MobileProgressiveImage({
  src,
  alt,
  placeholder,
  className = '',
  priority = false,
  sizes = '(max-width: 768px) 100vw, 50vw',
  onLoad,
  onError
}: MobileProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(priority ? src : placeholder);
  const imgRef = useRef<HTMLImageElement>(null);

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
    skip: priority
  });

  // Progressive loading
  useEffect(() => {
    if ((inView || priority) && !isLoaded && !hasError) {
      const img = new Image();
      
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
        onLoad?.();
      };
      
      img.onerror = () => {
        setHasError(true);
        onError?.();
      };
      
      // Generate responsive image URL for mobile optimization
      const optimizedSrc = generateResponsiveUrl(src);
      img.src = optimizedSrc;
    }
  }, [inView, priority, src, isLoaded, hasError, onLoad, onError]);

  const generateResponsiveUrl = (baseSrc: string) => {
    // For Pexels images, add mobile optimization parameters
    if (baseSrc.includes('pexels.com')) {
      const width = window.innerWidth <= 768 ? 800 : 1200;
      return `${baseSrc}?auto=compress&cs=tinysrgb&w=${width}&dpr=${window.devicePixelRatio || 1}`;
    }
    return baseSrc;
  };

  const generateSrcSet = (baseSrc: string) => {
    if (!baseSrc.includes('pexels.com')) return undefined;
    
    const sizes = [400, 800, 1200];
    return sizes
      .map(size => `${baseSrc}?auto=compress&cs=tinysrgb&w=${size} ${size}w`)
      .join(', ');
  };

  if (hasError) {
    return (
      <div 
        className={`bg-slate-200 dark:bg-slate-700 flex items-center justify-center ${className}`}
        ref={ref}
      >
        <span className="text-slate-400 text-mobile-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={`
          w-full h-full object-cover transition-all duration-500
          ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}
          ${placeholder && !isLoaded ? 'progressive-image' : ''}
        `}
        srcSet={generateSrcSet(src)}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
      
      {/* Loading placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 mobile-skeleton">
          <div className="w-full h-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
        </div>
      )}
    </div>
  );
}