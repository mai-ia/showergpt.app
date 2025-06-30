import React, { useState, useEffect } from 'react';
import { Table, AlertTriangle, CheckCircle, RefreshCw, Database, XCircle, Clock } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import Card from './ui/Card';
import Button from './ui/Button';

// Expected tables based on code analysis
const EXPECTED_TABLES = [
  'user_profiles',
  'shower_thoughts',
  'user_favorites',
  'comments',
  'live_sessions',
  'profiles',
  'thoughts',
  'categories',
  'favorites',
  'interactions',
  'notifications',
  'online_users'
];

interface TableStatus {
  name: string;
  exists: boolean | null;
  error: string | null;
  rowCount: number | null;
  checked: boolean;
}

export default function SchemaChecker() {
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Ready to check schema');
  const [missingTables, setMissingTables] = useState<string[]>([]);

  useEffect(() => {
    // Initialize table statuses
    setTableStatuses(
      EXPECTED_TABLES.map(name => ({
        name,
        exists: null,
        error: null,
        rowCount: null,
        checked: false
      }))
    );
  }, []);

  const checkTable = async (tableName: string): Promise<TableStatus> => {
    console.log(`Checking table: ${tableName}`);
    setStatusMessage(`Checking table: ${tableName}...`);
    
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      // Try to count rows in the table
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .abortSignal(controller.signal);
      
      clearTimeout(timeoutId);
      
      if (error) {
        console.error(`Error checking table ${tableName}:`, error);
        return {
          name: tableName,
          exists: false,
          error: error.message,
          rowCount: null,
          checked: true
        };
      }
      
      console.log(`Table ${tableName} exists with ${count} rows`);
      return {
        name: tableName,
        exists: true,
        error: null,
        rowCount: count || 0,
        checked: true
      };
    } catch (err: any) {
      console.error(`Error checking table ${tableName}:`, err);
      
      // Check if this was an abort error (timeout)
      if (err.name === 'AbortError') {
        return {
          name: tableName,
          exists: null,
          error: 'Query timed out after 10 seconds',
          rowCount: null,
          checked: true
        };
      }
      
      return {
        name: tableName,
        exists: false,
        error: err.message || 'Unknown error',
        rowCount: null,
        checked: true
      };
    }
  };

  const checkSchema = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setError('Supabase is not configured. Please check your environment variables.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setStatusMessage('Starting schema check...');
    
    // Reset table statuses
    setTableStatuses(
      EXPECTED_TABLES.map(name => ({
        name,
        exists: null,
        error: null,
        rowCount: null,
        checked: false
      }))
    );
    
    try {
      // Check each table with a small delay between checks to avoid overwhelming the database
      const missing: string[] = [];
      
      for (const tableName of EXPECTED_TABLES) {
        // Update status to show which table we're checking
        setTableStatuses(prev => 
          prev.map(t => 
            t.name === tableName 
              ? { ...t, checked: false } 
              : t
          )
        );
        
        const status = await checkTable(tableName);
        
        // Update the status for this table
        setTableStatuses(prev => 
          prev.map(t => 
            t.name === tableName 
              ? status
              : t
          )
        );
        
        if (!status.exists) {
          missing.push(tableName);
        }
        
        // Small delay between checks
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setMissingTables(missing);
      
      if (missing.length > 0) {
        setStatusMessage(`Schema check complete. Found ${missing.length} missing tables.`);
      } else {
        setStatusMessage('Schema check complete. All expected tables exist.');
      }
    } catch (err: any) {
      console.error('Error checking schema:', err);
      setError(err.message || 'An error occurred while checking the schema');
      setStatusMessage('Schema check failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card variant="elevated" className="mb-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl">
          <Table className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Schema Checker
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Verify database tables expected by the application
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Status and Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Schema Status:
              </span>
              {isLoading ? (
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Checking...
                </span>
              ) : missingTables.length > 0 ? (
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <XCircle className="w-4 h-4" />
                  Missing Tables
                </span>
              ) : tableStatuses.some(t => t.checked) ? (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  Schema Valid
                </span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">Not checked</span>
              )}
            </div>
            
            {/* Status Message */}
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <span className="text-blue-600 dark:text-blue-400">{statusMessage}</span>
            </div>
          </div>
          
          <Button
            onClick={checkSchema}
            disabled={isLoading}
            variant="primary"
            size="md"
            leftIcon={isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          >
            {isLoading ? 'Checking...' : 'Check Schema'}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-700 dark:text-red-300 mb-1">
                  Schema Check Error
                </h3>
                <p className="text-red-600 dark:text-red-400 text-sm">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Table Status Table */}
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
            Expected Tables
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-700">
                  <th className="text-left p-3 text-slate-700 dark:text-slate-300 font-semibold">Table Name</th>
                  <th className="text-left p-3 text-slate-700 dark:text-slate-300 font-semibold">Status</th>
                  <th className="text-left p-3 text-slate-700 dark:text-slate-300 font-semibold">Row Count</th>
                  <th className="text-left p-3 text-slate-700 dark:text-slate-300 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {tableStatuses.map((table, index) => (
                  <tr 
                    key={table.name}
                    className={`
                      ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-700/50'}
                      ${!table.exists && table.checked ? 'bg-red-50 dark:bg-red-900/20' : ''}
                    `}
                  >
                    <td className="p-3 text-slate-800 dark:text-slate-200 font-mono">
                      {table.name}
                    </td>
                    <td className="p-3">
                      {table.checked ? (
                        table.exists ? (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            Exists
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            <XCircle className="w-4 h-4" />
                            Missing
                          </span>
                        )
                      ) : isLoading && tableStatuses.findIndex(t => t.name === table.name && !t.checked) === 0 ? (
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Checking...
                        </span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400">
                          Not checked
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {table.rowCount !== null ? table.rowCount : '-'}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {table.error || (table.exists ? 'Table is accessible' : 'Table does not exist')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Missing Tables Summary */}
        {missingTables.length > 0 && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-1">
                  Missing Tables Detected
                </h3>
                <p className="text-yellow-600 dark:text-yellow-400 text-sm mb-2">
                  The following tables expected by the application are missing from the database:
                </p>
                <div className="flex flex-wrap gap-2">
                  {missingTables.map(table => (
                    <span 
                      key={table}
                      className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 rounded-lg text-xs font-mono"
                    >
                      {table}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-sm text-yellow-600 dark:text-yellow-400">
                  This could indicate a schema mismatch between your application and database.
                  Check your migrations and ensure they've been applied correctly.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}