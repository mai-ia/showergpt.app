/*
 * Environment Configuration for ShowerGPT
 * 
 * Environment Variables Template:
 * ================================
 * 
 * Create a .env file in your project root with these variables:
 * 
 * # OpenAI API Configuration
 * VITE_OPENAI_API_KEY=your_openai_api_key_here
 * 
 * # Optional: Development Mode (enables mock data)
 * VITE_DEV_MODE=true
 * 
 * # Optional: API Rate Limiting
 * VITE_API_RATE_LIMIT=10
 * VITE_API_RATE_WINDOW_HOURS=1
 * 
 * Setup Instructions:
 * ==================
 * 
 * 1. Get OpenAI API Key:
 *    - Visit https://platform.openai.com/api-keys
 *    - Create a new API key
 *    - Copy the key (starts with 'sk-')
 * 
 * 2. Create .env file:
 *    - Copy .env.example to .env
 *    - Replace 'your_openai_api_key_here' with your actual API key
 * 
 * 3. Restart development server:
 *    - Stop the dev server (Ctrl+C)
 *    - Run 'npm run dev' again
 * 
 * 4. Verify setup:
 *    - Look for "AI-powered brilliance" in the header
 *    - Toggle should appear in the input section
 */

export interface EnvironmentConfig {
  openai: {
    apiKey: string | null;
    isConfigured: boolean;
    rateLimit: number;
    rateWindowHours: number;
  };
  development: {
    isDev: boolean;
    useMockData: boolean;
  };
  app: {
    name: string;
    version: string;
  };
}

// Validate environment variables
function validateEnvironment(): EnvironmentConfig {
  const config: EnvironmentConfig = {
    openai: {
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || null,
      isConfigured: false,
      rateLimit: parseInt(import.meta.env.VITE_API_RATE_LIMIT || '10'),
      rateWindowHours: parseInt(import.meta.env.VITE_API_RATE_WINDOW_HOURS || '1'),
    },
    development: {
      isDev: import.meta.env.DEV || false,
      useMockData: import.meta.env.VITE_DEV_MODE === 'true' || false,
    },
    app: {
      name: 'ShowerGPT',
      version: '1.0.0',
    },
  };

  // Validate OpenAI API key format
  if (config.openai.apiKey) {
    if (config.openai.apiKey.startsWith('sk-') && config.openai.apiKey.length > 20) {
      config.openai.isConfigured = true;
    } else {
      console.warn('⚠️ Invalid OpenAI API key format. Expected format: sk-...');
      config.openai.apiKey = null;
    }
  }

  return config;
}

// Get validated environment configuration
export const env = validateEnvironment();

// Environment status messages
export const getEnvironmentStatus = () => {
  const status = {
    openai: {
      configured: env.openai.isConfigured,
      message: env.openai.isConfigured 
        ? '✅ OpenAI API configured successfully'
        : '⚠️ OpenAI API key not configured - using template generation',
    },
    development: {
      isDev: env.development.isDev,
      message: env.development.isDev 
        ? '🔧 Development mode active'
        : '🚀 Production mode',
    },
  };

  return status;
};

// Log environment status (only in development)
if (env.development.isDev) {
  const status = getEnvironmentStatus();
  console.log('🚿 ShowerGPT Environment Status:');
  console.log(status.openai.message);
  console.log(status.development.message);
  
  if (!env.openai.isConfigured) {
    console.log('');
    console.log('📝 To enable AI features:');
    console.log('1. Get API key: https://platform.openai.com/api-keys');
    console.log('2. Add to .env: VITE_OPENAI_API_KEY=your_key_here');
    console.log('3. Restart dev server');
  }
}