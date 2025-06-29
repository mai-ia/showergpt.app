import React, { useState, useEffect } from 'react';
import { Droplets, Heart, Sparkles } from 'lucide-react';
import { ShowerThought, GenerationRequest } from './types';
import { generateShowerThought } from './utils/thoughtGenerator';
import { checkRateLimit } from './utils/rateLimit';
import InputSection from './components/InputSection';
import ThoughtsList from './components/ThoughtsList';
import SavedThoughts from './components/SavedThoughts';

function App() {
  const [thoughts, setThoughts] = useState<ShowerThought[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showSaved, setShowSaved] = useState(false);
  const [savedThoughtsRefresh, setSavedThoughtsRefresh] = useState(0);

  // Update page title
  useEffect(() => {
    document.title = 'ShowerGPT - Whimsical Shower Thoughts';
  }, []);

  const handleGenerate = async (request: GenerationRequest) => {
    setError('');
    
    // Check rate limit
    const rateCheck = checkRateLimit();
    if (!rateCheck.allowed) {
      const resetDate = new Date(rateCheck.resetTime!);
      const resetTime = resetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setError(`Rate limit exceeded. Try again after ${resetTime}.`);
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API delay for realistic experience
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      const newThought = generateShowerThought(request);
      setThoughts(prev => [newThought, ...prev]);
    } catch (err) {
      setError('Failed to generate thought. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavoriteChange = () => {
    setSavedThoughtsRefresh(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-2xl">
                <Droplets className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">ShowerGPT</h1>
                <p className="text-slate-600">Whimsical thoughts for your wandering mind</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowSaved(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors duration-300"
            >
              <Heart className="w-5 h-5" />
              <span className="font-medium">Saved</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <InputSection
          onGenerate={handleGenerate}
          isLoading={isLoading}
          error={error}
        />

        {/* Thoughts Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-800">
              Generated Thoughts
              {thoughts.length > 0 && (
                <span className="text-lg font-normal text-slate-600 ml-2">
                  ({thoughts.length})
                </span>
              )}
            </h2>
          </div>
          
          <ThoughtsList
            thoughts={thoughts}
            onFavoriteChange={handleFavoriteChange}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-blue-100 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-slate-600">
            <p className="text-sm">
              Crafted with 💧 for moments of contemplation
            </p>
            <p className="text-xs mt-2 text-slate-500">
              Rate limited to 5 thoughts per minute for optimal shower-like pacing
            </p>
          </div>
        </div>
      </footer>

      {/* Saved Thoughts Modal */}
      {showSaved && (
        <SavedThoughts
          onClose={() => setShowSaved(false)}
          refreshTrigger={savedThoughtsRefresh}
        />
      )}
    </div>
  );
}

export default App;