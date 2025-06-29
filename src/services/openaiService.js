// OpenAI API Service for ShowerGPT
// Optimized for hackathon use with cost controls and error handling

import { env } from '../config/environment';
import { getRandomMockThought, getMockThoughtByTopic } from '../data/mockData';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second
const MAX_TOKENS = 100; // Keep responses short to control costs
const TEMPERATURE = 0.8; // Balance creativity with coherence

// Cost optimization: Use GPT-3.5-turbo for lower costs
const MODEL = 'gpt-3.5-turbo';

// Rate limiting for API calls
const API_RATE_LIMIT_KEY = 'openai-rate-limit';
const MAX_API_CALLS = env.openai.rateLimit;
const RATE_WINDOW_HOURS = env.openai.rateWindowHours;

// Prompt templates optimized for different thought types
const PROMPT_TEMPLATES = {
  philosophical: {
    system: "You are a philosophical shower thought generator. Create profound, contemplative thoughts that make people question reality, existence, and the nature of consciousness. Keep responses under 280 characters.",
    user: (topic) => `Generate a deep, philosophical shower thought${topic ? ` about ${topic}` : ''}. Make it thought-provoking and mind-bending. Focus on existential questions, consciousness, reality, or the nature of being.`
  },
  humorous: {
    system: "You are a witty shower thought generator. Create funny, clever observations about everyday life that make people chuckle and think 'that's so true!' Keep responses under 280 characters.",
    user: (topic) => `Generate a funny, witty shower thought${topic ? ` about ${topic}` : ''}. Make it clever, relatable, and amusing. Focus on absurd observations about daily life, human behavior, or silly realizations.`
  },
  scientific: {
    system: "You are a scientific shower thought generator. Create fascinating thoughts that blend science, physics, biology, or technology with everyday observations. Keep responses under 280 characters.",
    user: (topic) => `Generate a scientific shower thought${topic ? ` about ${topic}` : ''}. Make it intellectually curious and scientifically interesting. Focus on physics, biology, chemistry, space, or technology concepts.`
  }
};

// Check API rate limit
function checkApiRateLimit() {
  try {
    const stored = localStorage.getItem(API_RATE_LIMIT_KEY);
    const now = Date.now();
    
    if (!stored) {
      const newLimit = {
        count: 1,
        resetTime: now + (RATE_WINDOW_HOURS * 60 * 60 * 1000)
      };
      localStorage.setItem(API_RATE_LIMIT_KEY, JSON.stringify(newLimit));
      return { allowed: true, remaining: MAX_API_CALLS - 1 };
    }
    
    const rateLimit = JSON.parse(stored);
    
    // Reset if window has passed
    if (now > rateLimit.resetTime) {
      const newLimit = {
        count: 1,
        resetTime: now + (RATE_WINDOW_HOURS * 60 * 60 * 1000)
      };
      localStorage.setItem(API_RATE_LIMIT_KEY, JSON.stringify(newLimit));
      return { allowed: true, remaining: MAX_API_CALLS - 1 };
    }
    
    // Check if under limit
    if (rateLimit.count < MAX_API_CALLS) {
      rateLimit.count += 1;
      localStorage.setItem(API_RATE_LIMIT_KEY, JSON.stringify(rateLimit));
      return { allowed: true, remaining: MAX_API_CALLS - rateLimit.count };
    }
    
    const resetDate = new Date(rateLimit.resetTime);
    return { 
      allowed: false, 
      remaining: 0,
      resetTime: rateLimit.resetTime,
      resetTimeFormatted: resetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  } catch (error) {
    console.error('Error checking API rate limit:', error);
    return { allowed: true, remaining: MAX_API_CALLS };
  }
}

// Sleep function for retry delays
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate shower thought using OpenAI API or fallback to mock data
export async function generateShowerThoughtWithAI(request) {
  const { topic, mood } = request;
  
  // If OpenAI is not configured or in dev mode with mock data enabled, use mock data
  if (!env.openai.isConfigured || env.development.useMockData) {
    console.log('🎭 Using mock data for development');
    await sleep(1000 + Math.random() * 1000); // Simulate API delay
    
    if (topic) {
      return getMockThoughtByTopic(topic, mood);
    } else {
      return getRandomMockThought(mood);
    }
  }
  
  // Check rate limit first
  const rateCheck = checkApiRateLimit();
  if (!rateCheck.allowed) {
    throw new Error(`API rate limit exceeded. Try again after ${rateCheck.resetTimeFormatted}. (${rateCheck.remaining} calls remaining this hour)`);
  }
  
  const template = PROMPT_TEMPLATES[mood] || PROMPT_TEMPLATES.philosophical;
  
  const requestBody = {
    model: MODEL,
    messages: [
      {
        role: "system",
        content: template.system
      },
      {
        role: "user",
        content: template.user(topic)
      }
    ],
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    presence_penalty: 0.6, // Encourage more original thoughts
    frequency_penalty: 0.3, // Reduce repetition
    stop: ["\n\n"] // Stop at double newlines
  };
  
  let lastError;
  
  // Retry logic with exponential backoff
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.openai.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle specific OpenAI errors
        if (response.status === 401) {
          throw new Error('Invalid OpenAI API key. Please check your configuration.');
        } else if (response.status === 429) {
          throw new Error('OpenAI API rate limit exceeded. Please try again in a few minutes.');
        } else if (response.status === 402) {
          throw new Error('OpenAI API quota exceeded. Please check your billing settings.');
        } else if (response.status >= 500) {
          throw new Error('OpenAI service temporarily unavailable. Please try again.');
        } else {
          throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
        }
      }
      
      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from OpenAI API');
      }
      
      const content = data.choices[0].message.content.trim();
      
      if (!content) {
        throw new Error('Empty response from OpenAI API');
      }
      
      // Clean up the response (remove quotes if present)
      const cleanContent = content.replace(/^["']|["']$/g, '');
      
      // Ensure content is under character limit
      const finalContent = cleanContent.length > 280 
        ? cleanContent.substring(0, 277) + '...' 
        : cleanContent;
      
      // Return the shower thought object
      return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        content: finalContent,
        timestamp: new Date(),
        topic: topic || undefined,
        mood,
        isFavorite: false,
        variations: [],
        source: 'openai',
        tokensUsed: data.usage?.total_tokens || 0,
        cost: calculateCost(data.usage?.total_tokens || 0)
      };
      
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error.message.includes('API key') || 
          error.message.includes('quota') || 
          error.message.includes('billing')) {
        throw error;
      }
      
      // If this isn't the last attempt, wait before retrying
      if (attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY * Math.pow(2, attempt); // Exponential backoff
        console.warn(`API request failed (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${delay}ms:`, error.message);
        await sleep(delay);
      }
    }
  }
  
  // If all retries failed, throw the last error
  throw new Error(`Failed to generate thought after ${MAX_RETRIES} attempts: ${lastError.message}`);
}

// Calculate approximate cost for tracking
function calculateCost(tokens) {
  // GPT-3.5-turbo pricing (as of 2024): $0.0015 per 1K input tokens, $0.002 per 1K output tokens
  // Approximate cost calculation (assuming roughly equal input/output)
  const costPer1KTokens = 0.00175; // Average of input/output costs
  return (tokens / 1000) * costPer1KTokens;
}

// Get API usage statistics
export function getApiUsageStats() {
  try {
    const stored = localStorage.getItem(API_RATE_LIMIT_KEY);
    if (!stored) {
      return {
        callsUsed: 0,
        callsRemaining: MAX_API_CALLS,
        resetTime: null
      };
    }
    
    const rateLimit = JSON.parse(stored);
    const now = Date.now();
    
    if (now > rateLimit.resetTime) {
      return {
        callsUsed: 0,
        callsRemaining: MAX_API_CALLS,
        resetTime: null
      };
    }
    
    return {
      callsUsed: rateLimit.count,
      callsRemaining: MAX_API_CALLS - rateLimit.count,
      resetTime: new Date(rateLimit.resetTime).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  } catch (error) {
    console.error('Error getting API usage stats:', error);
    return {
      callsUsed: 0,
      callsRemaining: MAX_API_CALLS,
      resetTime: null
    };
  }
}

// Check if OpenAI is configured and available
export function isOpenAIConfigured() {
  return env.openai.isConfigured;
}

// Generate variation using OpenAI or mock data
export async function generateVariationWithAI(originalThought) {
  const request = {
    topic: originalThought.topic || '',
    mood: originalThought.mood
  };
  
  const newThought = await generateShowerThoughtWithAI(request);
  
  // Add the new variation to the original thought's variations
  const variations = originalThought.variations || [];
  variations.push(newThought.content);
  
  return {
    ...newThought,
    variations: variations.slice(-3) // Keep last 3 variations
  };
}