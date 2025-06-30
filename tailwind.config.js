/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-gentle': 'pulseGentle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'toast-progress': 'toastProgress 5s linear forwards',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
        'typewriter': 'typewriter 3s steps(40) infinite',
        'gradient-x': 'gradient-x 15s ease infinite',
        'gradient-y': 'gradient-y 15s ease infinite',
        'gradient-xy': 'gradient-xy 15s ease infinite',
        // Mobile-specific animations
        'mobile-fade-in': 'mobileFadeIn 0.3s ease-out',
        'mobile-slide-up': 'mobileSlideUp 0.3s ease-out',
        'mobile-bounce': 'mobileBounce 0.4s ease-out',
        'mobile-shimmer': 'mobileShimmer 1.5s infinite',
        'haptic-light': 'hapticLight 0.1s ease-out',
        'haptic-medium': 'hapticMedium 0.15s ease-out',
        'haptic-heavy': 'hapticHeavy 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(30px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        bounceGentle: {
          '0%, 20%, 50%, 80%, 100%': {
            transform: 'translateY(0)',
          },
          '40%': {
            transform: 'translateY(-10px)',
          },
          '60%': {
            transform: 'translateY(-5px)',
          },
        },
        pulseGentle: {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '0.7',
          },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '-200px 0',
          },
          '100%': {
            backgroundPosition: 'calc(200px + 100%) 0',
          },
        },
        toastProgress: {
          '0%': {
            width: '100%',
          },
          '100%': {
            width: '0%',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
        glow: {
          '0%': {
            boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)',
          },
          '100%': {
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)',
          },
        },
        wiggle: {
          '0%, 100%': {
            transform: 'rotate(-3deg)',
          },
          '50%': {
            transform: 'rotate(3deg)',
          },
        },
        heartbeat: {
          '0%, 100%': {
            transform: 'scale(1)',
          },
          '50%': {
            transform: 'scale(1.1)',
          },
        },
        typewriter: {
          '0%': {
            width: '0',
          },
          '50%': {
            width: '100%',
          },
          '100%': {
            width: '0',
          },
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        'gradient-y': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'center top'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'center bottom'
          },
        },
        'gradient-xy': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        // Mobile-specific keyframes
        mobileFadeIn: {
          from: {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        mobileSlideUp: {
          from: {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        mobileBounce: {
          '0%, 20%, 50%, 80%, 100%': {
            transform: 'translateY(0)',
          },
          '40%': {
            transform: 'translateY(-5px)',
          },
          '60%': {
            transform: 'translateY(-3px)',
          },
        },
        mobileShimmer: {
          '0%': {
            backgroundPosition: '-200px 0',
          },
          '100%': {
            backgroundPosition: 'calc(200px + 100%) 0',
          },
        },
        hapticLight: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.98)' },
        },
        hapticMedium: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
        },
        hapticHeavy: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.92)' },
        },
      },
      backdropBlur: {
        'custom': '10px',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'sans-serif'
        ],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5' }],
        'sm': ['0.875rem', { lineHeight: '1.5' }],
        'base': ['1rem', { lineHeight: '1.6' }],
        'lg': ['1.125rem', { lineHeight: '1.6' }],
        'xl': ['1.25rem', { lineHeight: '1.6' }],
        '2xl': ['1.5rem', { lineHeight: '1.4' }],
        '3xl': ['1.875rem', { lineHeight: '1.3' }],
        '4xl': ['2.25rem', { lineHeight: '1.2' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        // Mobile-optimized font sizes
        'mobile-xs': ['12px', { lineHeight: '1.4' }],
        'mobile-sm': ['14px', { lineHeight: '1.5' }],
        'mobile-base': ['16px', { lineHeight: '1.6' }],
        'mobile-lg': ['18px', { lineHeight: '1.6' }],
        'mobile-xl': ['20px', { lineHeight: '1.5' }],
        'mobile-2xl': ['24px', { lineHeight: '1.4' }],
        'mobile-3xl': ['28px', { lineHeight: '1.3' }],
        'mobile-4xl': ['32px', { lineHeight: '1.2' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        // Touch-friendly spacing
        'touch-sm': '8px',
        'touch-md': '12px',
        'touch-lg': '16px',
        'touch-xl': '24px',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        '3xl': '0 35px 60px -12px rgba(0, 0, 0, 0.3)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glow-lg': '0 0 40px rgba(59, 130, 246, 0.6)',
      },
      colors: {
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      // Mobile-specific utilities
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
      scale: {
        '98': '0.98',
      },
    },
  },
  plugins: [
    function({ addUtilities, addComponents }) {
      addUtilities({
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
        },
        '.scrollbar-thumb-blue-500': {
          'scrollbar-color': '#3b82f6 transparent',
        },
        '.scrollbar-track-blue-100': {
          'scrollbar-color': '#3b82f6 #dbeafe',
        },
        '.dark .scrollbar-track-slate-700': {
          'scrollbar-color': '#3b82f6 #374151',
        },
        '.content-visibility-auto': {
          'content-visibility': 'auto',
          'contain-intrinsic-size': '300px',
        },
        '.will-change-transform': {
          'will-change': 'transform',
        },
        '.will-change-opacity': {
          'will-change': 'opacity',
        },
        '.gpu-accelerated': {
          'transform': 'translateZ(0)',
          'backface-visibility': 'hidden',
          'perspective': '1000px',
        },
        '.text-shadow': {
          'text-shadow': '0 2px 4px rgba(0,0,0,0.1)',
        },
        '.text-shadow-lg': {
          'text-shadow': '0 4px 8px rgba(0,0,0,0.2)',
        },
        // Mobile-specific utilities
        '.touch-target': {
          'min-height': '44px',
          'min-width': '44px',
          'touch-action': 'manipulation',
        },
        '.mobile-optimized': {
          'contain': 'layout style paint',
          'content-visibility': 'auto',
          'contain-intrinsic-size': '300px',
        },
        '.safe-area-top': {
          'padding-top': 'env(safe-area-inset-top)',
        },
        '.safe-area-bottom': {
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },
        '.safe-area-left': {
          'padding-left': 'env(safe-area-inset-left)',
        },
        '.safe-area-right': {
          'padding-right': 'env(safe-area-inset-right)',
        },
        '.mobile-hidden': {
          'display': 'none',
        },
        '.mobile-visible': {
          'display': 'block',
        },
        '@media (min-width: 768px)': {
          '.mobile-hidden': {
            'display': 'block',
          },
          '.mobile-visible': {
            'display': 'none',
          },
        },
      });

      addComponents({
        '.mobile-card': {
          '@apply bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 mobile-optimized': {},
        },
        '.mobile-button': {
          '@apply touch-target inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95': {},
        },
        '.mobile-input': {
          '@apply w-full px-4 py-3 text-mobile-base bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-2xl transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20 focus:outline-none': {},
        },
        '.mobile-grid-1': {
          '@apply grid grid-cols-1 gap-4': {},
        },
        '.mobile-grid-2': {
          '@apply grid grid-cols-1 sm:grid-cols-2 gap-4': {},
        },
        '.mobile-grid-auto': {
          '@apply grid gap-4': {},
          'grid-template-columns': 'repeat(auto-fit, minmax(280px, 1fr))',
        },
      });
    },
  ],
};