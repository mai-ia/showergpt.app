import React, { useState } from 'react';
import { AlertTriangle, X, ExternalLink, Copy, Check } from 'lucide-react';
import { env } from '../config/environment';

export default function EnvironmentWarning() {
  const [isVisible, setIsVisible] = useState(!env.openai.isConfigured);
  const [copied, setCopied] = useState(false);

  if (!isVisible || env.openai.isConfigured) {
    return null;
  }

  const handleCopyEnvExample = async () => {
    const envExample = `# OpenAI API Configuration
# Get your API key from: https://platform.openai.com/api-keys
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Optional: Development Mode
VITE_DEV_MODE=true`;

    try {
      await navigator.clipboard.writeText(envExample);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 p-6 mb-8 rounded-r-2xl shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="bg-amber-100 p-2 rounded-full">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-amber-800 mb-2">
              🤖 AI Features Not Configured
            </h3>
            <p className="text-amber-700 mb-4 leading-relaxed">
              You're currently using template-based generation. To unlock AI-powered shower thoughts, 
              you'll need to configure your OpenAI API key.
            </p>
            
            <div className="space-y-4">
              <div className="bg-white bg-opacity-60 rounded-xl p-4 border border-amber-200">
                <h4 className="font-semibold text-amber-800 mb-2">Quick Setup:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-amber-700">
                  <li>
                    Get your API key from{' '}
                    <a 
                      href="https://platform.openai.com/api-keys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      OpenAI Platform
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>Create a <code className="bg-amber-100 px-2 py-1 rounded text-xs">.env</code> file in your project root</li>
                  <li>Add your API key to the file</li>
                  <li>Restart the development server</li>
                </ol>
              </div>
              
              <div className="bg-slate-900 rounded-xl p-4 text-green-400 font-mono text-sm relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400"># .env file content:</span>
                  <button
                    onClick={handleCopyEnvExample}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="space-y-1">
                  <div>VITE_OPENAI_API_KEY=<span className="text-yellow-400">your_api_key_here</span></div>
                  <div className="text-slate-500"># Optional: VITE_DEV_MODE=true</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <span>Don't worry - the app works great with templates too!</span>
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setIsVisible(false)}
          className="p-2 rounded-full hover:bg-amber-100 transition-colors"
          title="Dismiss warning"
        >
          <X className="w-5 h-5 text-amber-600" />
        </button>
      </div>
    </div>
  );
}