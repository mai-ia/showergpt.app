import React from 'react';

export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="
        sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
        bg-blue-600 text-white px-4 py-2 rounded-lg font-medium z-[10000]
        focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50
        transition-all duration-200
      "
    >
      Skip to main content
    </a>
  );
}