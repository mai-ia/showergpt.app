import React, { useState, useEffect } from 'react';
import { Key, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';

export default function EnvVariableChecker() {
  const [supabaseUrl, setSupabaseUrl] = useState<string | null>(null);
  const [supabaseKey, setSupabaseKey] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkEnvironmentVariables();
  }, []);

  const checkEnvironmentVariables = () => {
    setIsRefreshing(true);
    
    try {
      // Get environment variables
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Set state with masked values
      setSupabaseUrl(url ? url : null);
      setSupabaseKey(key ? key : null);
      
      console.log('Environment variables checked:', {
        urlPresent: !!url,
        keyPresent: !!key
      });
    } catch (error) {
      console.error('Error checking environment variables:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Mask sensitive values
  const maskValue = (value: string | null): string => {
    if (!value) return 'MISSING';
    
    // Show first 10 characters and mask the rest
    if (value.length > 10) {
      return `${value.substring(0, 10)}${'*'.repeat(10)}`;
    }
    
    return value;
  };

  // Get status indicator
  const getStatusIndicator = (value: string | null) => {
    if (!value) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  return (
    <Card variant="elevated" className="mb-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl">
          <Key className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Environment Variables
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Check your Supabase configuration values
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Variables Display */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  VITE_SUPABASE_URL:
                </span>
                {getStatusIndicator(supabaseUrl)}
              </div>
              <code className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm font-mono">
                {supabaseUrl ? maskValue(supabaseUrl) : 'MISSING'}
              </code>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  VITE_SUPABASE_ANON_KEY:
                </span>
                {getStatusIndicator(supabaseKey)}
              </div>
              <code className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm font-mono">
                {supabaseKey ? maskValue(supabaseKey) : 'MISSING'}
              </code>
            </div>
          </div>
        </div>

        {/* Status Summary */}
        {(supabaseUrl === null || supabaseKey === null) && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-1">
                  Missing Environment Variables
                </h3>
                <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                  {!supabaseUrl && !supabaseKey 
                    ? 'Both Supabase URL and Anon Key are missing.' 
                    : !supabaseUrl 
                      ? 'Supabase URL is missing.' 
                      : 'Supabase Anon Key is missing.'}
                </p>
                <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                  Create a <code className="px-1 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 rounded">.env</code> file in the project root with these variables.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button
            onClick={checkEnvironmentVariables}
            disabled={isRefreshing}
            variant="secondary"
            size="sm"
            leftIcon={isRefreshing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>
    </Card>
  );
}