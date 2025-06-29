import React, { useState, useRef, useEffect, memo } from 'react';
import { useInView } from 'react-intersection-observer';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
  sizes?: string;
  quality?: number;
}

const LazyImage = memo(function LazyImage({
  src,
  alt,
  className = '',
  placeholder,
  blurDataURL,
  onLoad,
  onError,
  priority = false,
  sizes,
  quality = 75
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(priority ? src : placeholder || blurDataURL);
  const imgRef = useRef<HTMLImageElement>(null);

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
    skip: priority
  });

  // Preload image when in view or priority
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
      
      // Optimize image URL with quality parameter
      const optimizedSrc = src.includes('pexels.com') 
        ? `${src}?auto=compress&cs=tinysrgb&w=800&q=${quality}`
        : src;
      
      img.src = optimizedSrc;
    }
  }, [inView, priority, src, isLoaded, hasError, onLoad, onError, quality]);

  // Generate responsive srcSet for better performance
  const generateSrcSet = (baseSrc: string) => {
    if (!baseSrc.includes('pexels.com')) return undefined;
    
    const sizes = [400, 800, 1200, 1600];
    return sizes
      .map(size => `${baseSrc}?auto=compress&cs=tinysrgb&w=${size}&q=${quality} ${size}w`)
      .join(', ');
  };

  if (hasError) {
    return (
      <div 
        className={`bg-slate-200 dark:bg-slate-700 flex items-center justify-center ${className}`}
        ref={ref}
      >
        <span className="text-slate-400 text-sm">Failed to load image</span>
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
          ${blurDataURL && !isLoaded ? 'blur-sm' : ''}
        `}
        srcSet={generateSrcSet(src)}
        sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
      
      {/* Loading placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse">
          <div className="w-full h-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 animate-shimmer"></div>
        </div>
      )}
    </div>
  );
});

export default LazyImage;