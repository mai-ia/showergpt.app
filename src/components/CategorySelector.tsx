import React from 'react';
import { thoughtCategories } from '../data/categories';
import { ThoughtCategory } from '../types';

interface CategorySelectorProps {
  selectedCategory?: string;
  onCategoryChange: (categoryId: string) => void;
  className?: string;
}

export default function CategorySelector({ 
  selectedCategory, 
  onCategoryChange, 
  className = '' 
}: CategorySelectorProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-lg font-semibold text-slate-700 dark:text-slate-300">
        Category <span className="text-slate-500 font-normal">(optional)</span>
      </label>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          onClick={() => onCategoryChange('')}
          className={`
            p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 text-center
            ${!selectedCategory
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
            }
          `}
        >
          <div className="text-2xl mb-2">🎲</div>
          <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Random</div>
        </button>
        
        {thoughtCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`
              p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 text-center
              ${selectedCategory === category.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
              }
            `}
            title={category.description}
          >
            <div className="text-2xl mb-2">{category.icon}</div>
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {category.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}