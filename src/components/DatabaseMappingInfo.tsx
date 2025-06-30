import React, { useState } from 'react';
import { Database, Table, RefreshCw, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { getAvailableTables, getTableName } from '../services/databaseMappingService';
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

export default function DatabaseMappingInfo() {
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const checkAvailableTables = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tables = await getAvailableTables();
      setAvailableTables(tables);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch available tables');
    } finally {
      setIsLoading(false);
    }
  };

  // Get the mapping status for a table
  const getTableStatus = (appTableName: string) => {
    const dbTableName = getTableName(appTableName as any);
    const exists = availableTables.includes(dbTableName);
    
    return {
      appTableName,
      dbTableName,
      exists,
      isMapped: appTableName !== dbTableName
    };
  };

  // Get all table statuses
  const getTableStatuses = () => {
    return EXPECTED_TABLES.map(getTableStatus);
  };

  return (
    <Card variant="elevated" className="mb-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-xl">
          <Database className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Database Mapping
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Table name mapping between application code and database
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Action Button */}
        <div className="flex justify-end">
          <Button
            onClick={checkAvailableTables}
            disabled={isLoading}
            variant="primary"
            size="md"
            leftIcon={isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : undefined}
          >
            {isLoading ? 'Checking...' : 'Check Available Tables'}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-700 dark:text-red-300 mb-1">
                  Error Checking Tables
                </h3>
                <p className="text-red-600 dark:text-red-400 text-sm">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Table Mapping Info */}
        {availableTables.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                Table Mapping
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
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-700">
                    <th className="text-left p-3 text-slate-700 dark:text-slate-300 font-semibold">App Table Name</th>
                    <th className="text-left p-3 text-slate-700 dark:text-slate-300 font-semibold">DB Table Name</th>
                    <th className="text-left p-3 text-slate-700 dark:text-slate-300 font-semibold">Status</th>
                    {showDetails && (
                      <th className="text-left p-3 text-slate-700 dark:text-slate-300 font-semibold">Details</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {getTableStatuses().map((status, index) => (
                    <tr 
                      key={status.appTableName}
                      className={`
                        ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-700/50'}
                        ${!status.exists ? 'bg-red-50 dark:bg-red-900/20' : ''}
                      `}
                    >
                      <td className="p-3 text-slate-800 dark:text-slate-200 font-mono">
                        {status.appTableName}
                      </td>
                      <td className="p-3 text-slate-800 dark:text-slate-200 font-mono">
                        {status.dbTableName}
                        {status.isMapped && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                            Mapped
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {status.exists ? (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            Available
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            <XCircle className="w-4 h-4" />
                            Missing
                          </span>
                        )}
                      </td>
                      {showDetails && (
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          {status.isMapped 
                            ? `App code using "${status.appTableName}" is mapped to "${status.dbTableName}" table`
                            : 'No mapping needed, table names match'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary */}
        {availableTables.length > 0 && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <div className="flex items-start gap-3">
              <Table className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-1">
                  Database Mapping Summary
                </h3>
                <p className="text-blue-600 dark:text-blue-400 text-sm">
                  Found {availableTables.length} tables in the database.
                </p>
                <p className="text-blue-600 dark:text-blue-400 text-sm mt-2">
                  The application code has been configured to map table names correctly. Any references to tables in the code will be automatically redirected to the correct tables in the database.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}