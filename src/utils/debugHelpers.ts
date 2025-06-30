/**
 * Debug Helpers for ShowerGPT
 * Utility functions to help diagnose and fix issues
 */

// Enable debug mode
export const DEBUG_MODE = true;

// Enhanced console logging with prefixes and colors
export const debug = {
  log: (message: string, data?: any) => {
    if (!DEBUG_MODE) return;
    console.log(`%c[DEBUG] ${message}`, 'color: #3b82f6', data || '');
  },
  
  error: (message: string, error?: any) => {
    if (!DEBUG_MODE) return;
    console.error(`%c[ERROR] ${message}`, 'color: #ef4444', error || '');
  },
  
  warn: (message: string, data?: any) => {
    if (!DEBUG_MODE) return;
    console.warn(`%c[WARN] ${message}`, 'color: #f59e0b', data || '');
  },
  
  info: (message: string, data?: any) => {
    if (!DEBUG_MODE) return;
    console.info(`%c[INFO] ${message}`, 'color: #10b981', data || '');
  },
  
  group: (label: string) => {
    if (!DEBUG_MODE) return;
    console.group(`%c[GROUP] ${label}`, 'color: #8b5cf6');
  },
  
  groupEnd: () => {
    if (!DEBUG_MODE) return;
    console.groupEnd();
  },
  
  trace: (message: string) => {
    if (!DEBUG_MODE) return;
    console.trace(`%c[TRACE] ${message}`, 'color: #6b7280');
  }
};

// Function to inspect object properties
export function inspectObject(obj: any, label = 'Object Inspection'): void {
  if (!DEBUG_MODE) return;
  
  debug.group(label);
  
  if (!obj) {
    debug.warn('Object is null or undefined');
    debug.groupEnd();
    return;
  }
  
  try {
    // Get all properties including non-enumerable ones
    const props = Object.getOwnPropertyNames(obj);
    
    if (props.length === 0) {
      debug.warn('Object has no properties');
    } else {
      props.forEach(prop => {
        try {
          const value = obj[prop];
          const type = typeof value;
          
          if (value === null) {
            debug.log(`${prop}: null`);
          } else if (value === undefined) {
            debug.log(`${prop}: undefined`);
          } else if (type === 'object') {
            if (value instanceof Date) {
              debug.log(`${prop} (Date): ${value.toISOString()}`);
            } else if (Array.isArray(value)) {
              debug.log(`${prop} (Array[${value.length}]): ${JSON.stringify(value.slice(0, 3))}${value.length > 3 ? '...' : ''}`);
            } else {
              debug.log(`${prop} (Object): ${JSON.stringify(value).substring(0, 100)}${JSON.stringify(value).length > 100 ? '...' : ''}`);
            }
          } else {
            debug.log(`${prop} (${type}): ${value}`);
          }
        } catch (err) {
          debug.error(`Error inspecting property ${prop}`, err);
        }
      });
    }
  } catch (err) {
    debug.error('Error during object inspection', err);
  }
  
  debug.groupEnd();
}

// Function to validate UUID format
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Function to check local storage data
export function inspectLocalStorage(key?: string): void {
  if (!DEBUG_MODE) return;
  
  debug.group('LocalStorage Inspection');
  
  try {
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          const parsed = JSON.parse(value);
          debug.log(`${key}:`, parsed);
        } catch (e) {
          debug.log(`${key} (raw string):`, value);
        }
      } else {
        debug.warn(`No data found for key: ${key}`);
      }
    } else {
      // Show all localStorage items
      debug.log('All LocalStorage Items:');
      
      if (localStorage.length === 0) {
        debug.warn('LocalStorage is empty');
      } else {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const value = localStorage.getItem(key);
            if (value) {
              try {
                const parsed = JSON.parse(value);
                debug.log(`${key}:`, parsed);
              } catch (e) {
                debug.log(`${key} (raw string):`, value);
              }
            }
          }
        }
      }
    }
  } catch (err) {
    debug.error('Error inspecting localStorage', err);
  }
  
  debug.groupEnd();
}

// Function to monitor network requests
export function monitorNetworkRequests(): void {
  if (!DEBUG_MODE || typeof window === 'undefined') return;
  
  const originalFetch = window.fetch;
  
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : input.url;
    const method = init?.method || (typeof input === 'string' ? 'GET' : input.method) || 'GET';
    
    debug.group(`Fetch Request: ${method} ${url}`);
    debug.log('Request details:', { url, method, headers: init?.headers, body: init?.body });
    
    try {
      const response = await originalFetch.apply(this, [input, init]);
      
      // Clone the response to avoid consuming it
      const clonedResponse = response.clone();
      
      try {
        const contentType = clonedResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await clonedResponse.json();
          debug.log('Response data:', data);
        } else {
          debug.log('Response is not JSON. Content-Type:', contentType);
        }
      } catch (err) {
        debug.warn('Could not parse response as JSON', err);
      }
      
      debug.log('Response status:', response.status, response.statusText);
      debug.groupEnd();
      
      return response;
    } catch (error) {
      debug.error('Fetch error:', error);
      debug.groupEnd();
      throw error;
    }
  };
  
  debug.info('Network request monitoring enabled');
}

// Function to check database connection
export async function checkDatabaseConnection(supabase: any): Promise<boolean> {
  if (!supabase) {
    debug.error('Supabase client is not initialized');
    return false;
  }
  
  try {
    debug.log('Testing database connection...');
    const { data, error } = await supabase.from('shower_thoughts').select('id').limit(1);
    
    if (error) {
      debug.error('Database connection test failed', error);
      return false;
    }
    
    debug.info('Database connection successful', data);
    return true;
  } catch (err) {
    debug.error('Error testing database connection', err);
    return false;
  }
}

// Function to clear application data (for troubleshooting)
export function clearAppData(): void {
  if (!DEBUG_MODE) return;
  
  debug.warn('Clearing all application data from localStorage...');
  
  const keysToKeep: string[] = []; // Add any keys you want to preserve
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !keysToKeep.includes(key)) {
      localStorage.removeItem(key);
    }
  }
  
  debug.info('Application data cleared. Refresh the page to start fresh.');
}

// Export all debug helpers
export default {
  debug,
  inspectObject,
  isValidUUID,
  inspectLocalStorage,
  monitorNetworkRequests,
  checkDatabaseConnection,
  clearAppData
};