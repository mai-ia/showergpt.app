import React, { useState } from 'react';
import { Database, CheckCircle, XCircle, RefreshCw, Info } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { tableExists, getAvailableTables } from '../services/databaseMappingService';
import Card from './ui/Card';
import Button from './ui/Button';

export default function DatabaseStatusChecker() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTables, setAvailableTables] = useState<string[]>([]);

  // Check database connection
  const checkConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!isSupabaseConfigured() || !supabase) {
        throw new Error('Supabase is not configured. Please check your environment variables.');
      }
      
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Test connection with a simple query
      const { data, error } = await supabase
        .from('pg_catalog.pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')
        .limit(1)
        .abortSignal(controller.signal);
      
      clearTimeout(timeoutId);
      
      if (error) {
        throw error;
      }
      
      setIsConnected(true);
      
      // Get available tables
      const tables = await getAvailableTables();
      setAvailableTables(tables);
      
      // Check if shower_thoughts table exists
      const hasShowerThoughts = await tableExists('shower_thoughts');
      
      if (!hasShowerThoughts) {
        setError('The shower_thoughts table is missing. Database schema may need to be updated.');
      }
      
    } catch (err: any) {
      setIsConnected(false);
      
      if (err.name === 'AbortError') {
        setError('Connection timed out. The database may be unavailable or overloaded.');
      } else {
        setError(err.message || 'An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card variant="elevated" className="mb-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
          <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Database Status
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Check your Supabase database connection
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Connection Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Connection Status:
              </span>
              {isConnected === null ? (
                <span className="text-slate-500 dark:text-slate-400">Not checked</span>
              ) : isConnected ? (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <XCircle className="w-4 h-4" />
                  Failed
                </span>
              )}
            </div>
            
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {isSupabaseConfigured() 
                ? 'Supabase configuration detected'
                : 'Supabase configuration missing'}
            </div>
            
            {availableTables.length > 0 && (
              <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                Found {availableTables.length} tables in the database
              </div>
            )}
          </div>
          
          <Button
            onClick={checkConnection}
            disabled={isLoading}
            variant="primary"
            size="md"
            leftIcon={isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : undefined}
          >
            {isLoading ? 'Checking...' : 'Check Connection'}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-700 dark:text-red-300 mb-1">
                  Connection Error
                </h3>
                <p className="text-red-600 dark:text-red-400 text-sm">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {isConnected && !error && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-700 dark:text-green-300 mb-1">
                  Connection Successful
                </h3>
                <p className="text-green-600 dark:text-green-400 text-sm">
                  Your database connection is working properly. The application is configured to map table names correctly.
                </p>
                <div className="mt-3">
                  <h4 className="font-medium text-green-700 dark:text-green-300 mb-1">Available Tables:</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableTables.map(table => (
                      <span 
                        key={table}
                        className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 rounded-lg text-xs font-mono"
                      >
                        {table}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}