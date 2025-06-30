import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function MinimalDatabaseTest() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number | null>(null);

  // Create a fresh Supabase client instance directly in the component
  const createFreshClient = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return null;
    }
    
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false, // Don't persist the session
        autoRefreshToken: false // Don't auto refresh the token
      }
    });
  };

  const testConnection = async () => {
    setStatus('loading');
    setResult(null);
    setError(null);
    setElapsedTime(null);
    
    const startTime = performance.now();
    
    // Create a fresh client for this test
    const freshClient = createFreshClient();
    
    if (!freshClient) {
      setStatus('error');
      setError('Missing Supabase URL or key in environment variables');
      return;
    }
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      // Perform the simplest possible query - SELECT version()
      const { data, error } = await freshClient.rpc('version', {}, {
        abortSignal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const endTime = performance.now();
      setElapsedTime(endTime - startTime);
      
      if (error) {
        console.error('Minimal database test error:', error);
        setStatus('error');
        setError(error.message || 'Unknown error');
        return;
      }
      
      setStatus('success');
      setResult(data || 'Connection successful, but no version data returned');
    } catch (err: any) {
      clearTimeout(timeoutId);
      const endTime = performance.now();
      setElapsedTime(endTime - startTime);
      
      console.error('Minimal database test exception:', err);
      setStatus('error');
      
      if (err.name === 'AbortError') {
        setError('Connection timed out after 5 seconds');
      } else {
        setError(err.message || 'Unknown error occurred');
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-xl">
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-indigo-600 dark:text-indigo-400"
          >
            <path d="M20 6L9 17L4 12" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Minimal Database Test
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Simple connection test with fresh client
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* Status Display */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Status:
            </span>
            {status === 'idle' && (
              <span className="text-slate-500 dark:text-slate-400">Ready to test</span>
            )}
            {status === 'loading' && (
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <svg 
                  className="animate-spin w-4 h-4" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Testing connection...
              </span>
            )}
            {status === 'success' && (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <svg 
                  className="w-4 h-4" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17L4 12" />
                </svg>
                Connected
              </span>
            )}
            {status === 'error' && (
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <svg 
                  className="w-4 h-4" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
                Connection failed
              </span>
            )}
          </div>
          
          {elapsedTime !== null && (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Time: {elapsedTime.toFixed(2)}ms
            </div>
          )}
        </div>
        
        {/* Result or Error */}
        {result && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2">
              Connection Successful
            </h3>
            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-green-200 dark:border-green-800 font-mono text-sm overflow-x-auto">
              {result}
            </div>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <h3 className="font-semibold text-red-700 dark:text-red-300 mb-2">
              Connection Error
            </h3>
            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-red-200 dark:border-red-800 font-mono text-sm overflow-x-auto">
              {error}
            </div>
          </div>
        )}
        
        {/* Test Button */}
        <div className="flex justify-end">
          <button
            onClick={testConnection}
            disabled={status === 'loading'}
            className={`
              px-4 py-2 rounded-xl font-medium
              ${status === 'loading' 
                ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md transition-all duration-200'
              }
            `}
          >
            {status === 'loading' ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
      </div>
    </div>
  );
}