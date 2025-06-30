import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { debug } from '../utils/debugHelpers';

/**
 * Database Mapping Service
 * 
 * This service maps application code table references to actual database tables.
 * It handles the discrepancy between table names used in the code and those in the database.
 */

// Table mapping configuration
// Maps the table names our code expects to the actual tables in the database
const TABLE_MAPPING = {
  // Core tables
  'thoughts': 'shower_thoughts',
  'profiles': 'user_profiles',
  'favorites': 'user_favorites',
  
  // These tables already match their names in the database
  'shower_thoughts': 'shower_thoughts',
  'user_profiles': 'user_profiles',
  'user_favorites': 'user_favorites',
  'comments': 'comments',
  'interactions': 'interactions',
  'notifications': 'notifications',
  'online_users': 'online_users',
  'live_sessions': 'live_sessions',
  'categories': 'categories'
};

// Type for table names
export type TableName = keyof typeof TABLE_MAPPING;

/**
 * Get the actual database table name from the application table name
 */
export function getTableName(appTableName: TableName): string {
  const dbTableName = TABLE_MAPPING[appTableName];
  debug.log(`Mapping table: ${appTableName} → ${dbTableName}`);
  return dbTableName;
}

/**
 * Create a query builder for the mapped table
 */
export function table<T = any>(appTableName: TableName) {
  if (!isSupabaseConfigured() || !supabase) {
    debug.error(`Supabase not configured, can't query table: ${appTableName}`);
    throw new Error('Supabase not configured');
  }
  
  const dbTableName = getTableName(appTableName);
  debug.log(`Creating query for table: ${appTableName} (${dbTableName})`);
  return supabase.from<T>(dbTableName);
}

/**
 * Execute a raw SQL query with proper table name mapping
 */
export async function executeRawQuery<T = any>(
  sql: string, 
  params: any[] = [], 
  options: { count?: 'exact' | 'planned' | 'estimated' } = {}
): Promise<{ data: T | null; error: any }> {
  if (!isSupabaseConfigured() || !supabase) {
    debug.error(`Supabase not configured, can't execute raw query`);
    throw new Error('Supabase not configured');
  }
  
  // Replace table names in the SQL query
  let mappedSql = sql;
  Object.entries(TABLE_MAPPING).forEach(([appTable, dbTable]) => {
    // Only replace whole words (with word boundaries)
    const regex = new RegExp(`\\b${appTable}\\b`, 'g');
    mappedSql = mappedSql.replace(regex, dbTable);
  });
  
  debug.log(`Executing raw query with mapped table names`);
  debug.log(`Original SQL: ${sql}`);
  debug.log(`Mapped SQL: ${mappedSql}`);
  
  return supabase.rpc('execute_sql', { sql: mappedSql, params }, options);
}

/**
 * Call a stored procedure with proper table name mapping
 */
export async function callProcedure<T = any>(
  procedureName: string,
  params: Record<string, any> = {}
): Promise<{ data: T | null; error: any }> {
  if (!isSupabaseConfigured() || !supabase) {
    debug.error(`Supabase not configured, can't call procedure: ${procedureName}`);
    throw new Error('Supabase not configured');
  }
  
  debug.log(`Calling procedure: ${procedureName} with params:`, params);
  return supabase.rpc(procedureName, params);
}

/**
 * Check if a table exists in the database
 */
export async function tableExists(appTableName: TableName): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    debug.error(`Supabase not configured, can't check if table exists: ${appTableName}`);
    return false;
  }
  
  const dbTableName = getTableName(appTableName);
  
  try {
    debug.log(`Checking if table exists: ${appTableName} (${dbTableName})`);
    
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    // Try to count rows in the table
    const { count, error } = await supabase
      .from(dbTableName)
      .select('*', { count: 'exact', head: true })
      .abortSignal(controller.signal);
    
    clearTimeout(timeoutId);
    
    if (error) {
      debug.error(`Error checking if table exists: ${dbTableName}`, error);
      return false;
    }
    
    debug.log(`Table ${dbTableName} exists with ${count} rows`);
    return true;
  } catch (err) {
    debug.error(`Exception checking if table exists: ${dbTableName}`, err);
    return false;
  }
}

/**
 * Get all available tables in the database
 */
export async function getAvailableTables(): Promise<string[]> {
  if (!isSupabaseConfigured() || !supabase) {
    debug.error(`Supabase not configured, can't get available tables`);
    return [];
  }
  
  try {
    debug.log(`Getting available tables`);
    
    const { data, error } = await supabase
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (error) {
      debug.error(`Error getting available tables`, error);
      return [];
    }
    
    const tables = data.map(row => row.tablename);
    debug.log(`Found ${tables.length} tables:`, tables);
    return tables;
  } catch (err) {
    debug.error(`Exception getting available tables`, err);
    return [];
  }
}

export default {
  getTableName,
  table,
  executeRawQuery,
  callProcedure,
  tableExists,
  getAvailableTables
};