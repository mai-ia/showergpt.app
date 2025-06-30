import React, { useState } from 'react';
import { Database, CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronUp, Table } from 'lucide-react';
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

  const checkConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!isSupabaseConfigured() || !supabase) {
        throw new Error('Supabase is not configured. Check your environment variables.');
      }

      console.log('Testing database connection...');
      
      // Test connection by querying a simple system table
      const { data: tablesData, error: tablesError } = await supabase
        .from('pg_catalog.pg_tables')
        .select('schemaname, tablename')
        .eq('schemaname', 'public')
        .order('tablename');

      if (tablesError) {
        console.error('Error fetching tables:', tablesError);
        throw new Error(`Database connection failed: ${tablesError.message}`);
      }

      console.log('Connection successful, found tables:', tablesData);
      setIsConnected(true);
      
      // Get table information
      const tableInfoPromises = tablesData.map(async (table) => {
        // Get column information
        const { data: columnsData, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type')
          .eq('table_schema', 'public')
          .eq('table_name', table.tablename)
          .order('ordinal_position');
          
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
          .select('*', { count: 'exact', head: true });
          
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
      });
      
      const tableInfo = await Promise.all(tableInfoPromises);
      setTables(tableInfo);
      
    } catch (err: any) {
      console.error('Database connection check failed:', err);
      setIsConnected(false);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
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
                <p className="text-red-600 dark:text-red-400 text-sm whitespace-pre-wrap">
                  {error}
                </p>
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
                            {table.columns.map((column, index) => (
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
                            ))}
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
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}