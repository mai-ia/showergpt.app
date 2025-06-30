import React, { useState, useEffect } from 'react';
import { Home, Search, Heart, User, Menu, X } from 'lucide-react';

interface MobileNavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  className?: string;
}

export default function MobileNavigation({ 
  currentPage, 
  onNavigate, 
  className = '' 
}: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-hide navigation on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const handleNavigation = (pageId: string) => {
    onNavigate(pageId);
    setIsMenuOpen(false);
    
    // Haptic feedback simulation
    const button = document.querySelector(`[data-nav="${pageId}"]`);
    if (button) {
      button.classList.add('haptic-light');
      setTimeout(() => {
        button.classList.remove('haptic-light');
      }, 100);
    }
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav 
        className={`
          mobile-sticky-footer fixed bottom-0 left-0 right-0 z-50
          bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg
          border-t border-slate-200 dark:border-slate-700
          safe-area-bottom transition-transform duration-300
          ${isVisible ? 'translate-y-0' : 'translate-y-full'}
          ${className}
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around px-2 py-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                data-nav={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`
                  touch-target flex flex-col items-center justify-center
                  px-3 py-2 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }
                `}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : 'scale-100'} transition-transform`} />
                <span className={`text-mobile-xs mt-1 ${isActive ? 'font-medium' : 'font-normal'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
          
          {/* Menu button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="touch-target flex flex-col items-center justify-center px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
            <span className="text-mobile-xs mt-1">Menu</span>
          </button>
        </div>
      </nav>

      {/* Full-screen menu overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-900 mobile-fade-in">
          <div className="safe-area-top safe-area-bottom flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-mobile-2xl font-bold text-slate-900 dark:text-slate-100">
                Menu
              </h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="touch-target p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-6 h-6 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            {/* Menu content */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.id)}
                      className={`
                        w-full flex items-center gap-4 p-4 rounded-2xl
                        transition-all duration-200 text-left
                        ${isActive 
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100'
                        }
                      `}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-mobile-lg font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Additional menu items */}
              <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 transition-colors text-left">
                    <span className="text-mobile-lg">Settings</span>
                  </button>
                  <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 transition-colors text-left">
                    <span className="text-mobile-lg">Help & Support</span>
                  </button>
                  <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 transition-colors text-left">
                    <span className="text-mobile-lg">About</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}