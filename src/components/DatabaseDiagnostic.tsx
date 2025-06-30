import React, { useState, useRef, useEffect } from 'react';
import { Database, CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronUp, Table, Clock, AlertTriangle, X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import Card from './ui/Card';
import Button from './ui/Button';

interface TableInfo {
  name: string;
  rowCount: number;
  columns: { name: string; type: string }[];
}

export default function DatabaseDiagnostic() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to check connection');
  const [timeoutWarning, setTimeoutWarning] = useState<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Validate Supabase configuration
  const validateSupabaseConfig = () => {
    console.log('Validating Supabase configuration...');
    
    if (!isSupabaseConfigured()) {
      console.error('Supabase is not configured');
      return {
        isValid: false,
        message: 'Supabase is not configured. Check your environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).'
      };
    }
    
    if (!supabase) {
      console.error('Supabase client is null');
      return {
        isValid: false,
        message: 'Supabase client initialization failed. Check your environment variables and browser console for errors.'
      };
    }
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || typeof supabaseUrl !== 'string' || !supabaseUrl.includes('supabase.co')) {
      console.error('Invalid Supabase URL:', supabaseUrl);
      return {
        isValid: false,
        message: `Invalid Supabase URL format: "${supabaseUrl}". URL should contain "supabase.co".`
      };
    }
    
    if (!supabaseKey || typeof supabaseKey !== 'string' || !supabaseKey.startsWith('eyJ')) {
      console.error('Invalid Supabase anon key:', supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'undefined');
      return {
        isValid: false,
        message: 'Invalid Supabase anon key format. Key should start with "eyJ".'
      };
    }
    
    console.log('Supabase configuration is valid');
    return { isValid: true, message: 'Supabase configuration is valid' };
  };

  const checkConnection = async () => {
    setIsLoading(true);
    setError(null);
    setStatusMessage('Validating Supabase configuration...');
    setTimeoutWarning(false);
    setTables([]);
    
    // Create a new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    // Set timeout for the entire operation
    timeoutRef.current = setTimeout(() => {
      setTimeoutWarning(true);
      setStatusMessage('Operation is taking longer than expected...');
    }, 5000);
    
    // Set a hard timeout to abort the operation
    const hardTimeoutRef = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        setIsLoading(false);
        setIsConnected(false);
        setError('Connection timed out after 10 seconds. This could indicate network issues, database performance problems, or incorrect credentials.');
        setStatusMessage('Connection timed out');
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    }, 10000);
    
    try {
      // First validate the configuration
      const configValidation = validateSupabaseConfig();
      if (!configValidation.isValid) {
        throw new Error(configValidation.message);
      }
      
      setStatusMessage('Testing database connection...');
      console.log('Testing database connection...');
      
      // Test connection by querying a simple system table
      const { data: tablesData, error: tablesError } = await supabase
        .from('pg_catalog.pg_tables')
        .select('schemaname, tablename')
        .eq('schemaname', 'public')
        .order('tablename')
        .abortSignal(signal);

      if (tablesError) {
        console.error('Error fetching tables:', tablesError);
        throw new Error(`Database connection failed: ${tablesError.message}`);
      }

      console.log('Connection successful, found tables:', tablesData);
      setIsConnected(true);
      setStatusMessage(`Found ${tablesData.length} tables. Fetching table details...`);
      
      // Get table information
      const tableInfoPromises = tablesData.map(async (table) => {
        try {
          setStatusMessage(`Analyzing table: ${table.tablename}...`);
          
          // Get column information
          const { data: columnsData, error: columnsError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type')
            .eq('table_schema', 'public')
            .eq('table_name', table.tablename)
            .order('ordinal_position')
            .abortSignal(signal);
            
          if (columnsError) {
            console.error(`Error fetching columns for ${table.tablename}:`, columnsError);
            return {
              name: table.tablename,
              rowCount: 0,
              columns: []
            };
          }
          
          // Get row count
          const { count, error: countError } = await supabase
            .from(table.tablename)
            .select('*', { count: 'exact', head: true })
            .abortSignal(signal);
            
          if (countError) {
            console.error(`Error fetching row count for ${table.tablename}:`, countError);
          }
          
          return {
            name: table.tablename,
            rowCount: count || 0,
            columns: columnsData.map(col => ({
              name: col.column_name,
              type: col.data_type
            }))
          };
        } catch (err) {
          console.error(`Error processing table ${table.tablename}:`, err);
          return {
            name: table.tablename,
            rowCount: 0,
            columns: []
          };
        }
      });
      
      setStatusMessage('Processing table information...');
      const tableInfo = await Promise.all(tableInfoPromises);
      setTables(tableInfo);
      setStatusMessage('Database analysis complete');
      
    } catch (err: any) {
      console.error('Database connection check failed:', err);
      setIsConnected(false);
      
      // Provide more specific guidance based on error message
      let errorMessage = err.message || 'Unknown error occurred';
      let troubleshootingTips = '';
      
      if (err.name === 'AbortError') {
        errorMessage = 'Connection timed out after 10 seconds.';
        troubleshootingTips = 'This could indicate network issues, database performance problems, or incorrect credentials.';
      } else if (errorMessage.includes('fetch failed')) {
        troubleshootingTips = 'This could be due to network connectivity issues, CORS restrictions, or an incorrect Supabase URL.';
      } else if (errorMessage.includes('JWT')) {
        troubleshootingTips = 'This indicates an issue with your Supabase anon key. Make sure it is correctly copied from your Supabase dashboard.';
      } else if (errorMessage.includes('permission denied')) {
        troubleshootingTips = 'This indicates a permissions issue. Check that your Supabase RLS policies are correctly configured.';
      }
      
      setError(`${errorMessage}${troubleshootingTips ? '\n\nTroubleshooting tips: ' + troubleshootingTips : ''}`);
    } finally {
      clearTimeout(hardTimeoutRef);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      setIsLoading(false);
    }
  };

  const cancelCheck = () => {
    console.log('Cancelling database check...');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsLoading(false);
    setStatusMessage('Check cancelled by user');
  };

  const toggleTableExpansion = (tableName: string) => {
    setExpandedTable(expandedTable === tableName ? null : tableName);
  };

  return (
    <Card variant="elevated" className="mb-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
          <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Database Diagnostic
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Check your Supabase database connection and schema
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
            
            {/* Status Message */}
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <span className="text-blue-600 dark:text-blue-400">{statusMessage}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {isLoading && (
              <Button
                onClick={cancelCheck}
                variant="danger"
                size="md"
              >
                Cancel Check
              </Button>
            )}
            
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
        </div>

        {/* Timeout Warning */}
        {timeoutWarning && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-1">
                  Operation Taking Longer Than Expected
                </h3>
                <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                  This could be due to slow network connection, database performance issues, or a large schema.
                  The operation will time out after 10 seconds.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-700 dark:text-red-300 mb-1">
                  Connection Error
                </h3>
                <p className="text-red-600 dark:text-red-400 text-sm whitespace-pre-wrap">
                  {error}
                </p>
                
                {/* Troubleshooting guidance */}
                <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <h4 className="font-medium text-red-700 dark:text-red-300 mb-1">Troubleshooting Steps:</h4>
                  <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400 space-y-1">
                    <li>Check that your Supabase project is active and not in a paused state</li>
                    <li>Verify your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file</li>
                    <li>Ensure your database has the expected tables and permissions</li>
                    <li>Check for network connectivity issues or CORS restrictions</li>
                    <li>Try refreshing the page and testing again</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tables List */}
        {tables.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                Database Tables ({tables.length})
              </h3>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {showDetails ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show Details
                  </>
                )}
              </button>
            </div>
            
            <div className="space-y-3">
              {tables.map((table) => (
                <div 
                  key={table.name}
                  className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
                >
                  <div 
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={() => toggleTableExpansion(table.name)}
                  >
                    <div className="flex items-center gap-2">
                      <Table className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {table.name}
                      </span>
                      <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">
                        {table.rowCount} rows
                      </span>
                    </div>
                    <button className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600">
                      {expandedTable === table.name ? (
                        <ChevronUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      )}
                    </button>
                  </div>
                  
                  {(expandedTable === table.name || showDetails) && (
                    <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Columns:
                      </h4>
                      <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-700">
                              <th className="text-left p-2 text-slate-700 dark:text-slate-300">Name</th>
                              <th className="text-left p-2 text-slate-700 dark:text-slate-300">Type</th>
                            </tr>
                          </thead>
                          <tbody>
                            {table.columns.length > 0 ? (
                              table.columns.map((column, index) => (
                                <tr 
                                  key={column.name}
                                  className={index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-700/50'}
                                >
                                  <td className="p-2 text-slate-800 dark:text-slate-200 font-mono text-xs">
                                    {column.name}
                                  </td>
                                  <td className="p-2 text-slate-600 dark:text-slate-400 font-mono text-xs">
                                    {column.type}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={2} className="p-2 text-center text-slate-500 dark:text-slate-400">
                                  No columns found or unable to retrieve column information
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connection Details */}
        {isConnected && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-700 dark:text-green-300 mb-1">
                  Connection Successful
                </h3>
                <p className="text-green-600 dark:text-green-400 text-sm">
                  Found {tables.length} tables in the database.
                </p>
                <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                  <p>Database URL: {import.meta.env.VITE_SUPABASE_URL}</p>
                  <p>Anon Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Present' : '✗ Missing'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}