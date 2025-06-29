import React, { useState } from 'react';
import { Database, X, ExternalLink, Copy, Check } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export default function SupabaseWarning() {
  const [isVisible, setIsVisible] = useState(!isSupabaseConfigured());
  const [copied, setCopied] = useState(false);

  if (!isVisible || isSupabaseConfigured()) {
    return null;
  }

  const handleCopyEnvExample = async () => {
    const envExample = `# Supabase Configuration
# Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`;

    try {
      await navigator.clipboard.writeText(envExample);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-400 p-6 mb-8 rounded-r-2xl shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="bg-purple-100 p-2 rounded-full">
            <Database className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-purple-800 mb-2">
              🔐 Authentication Features Disabled
            </h3>
            <p className="text-purple-700 mb-4 leading-relaxed">
              User authentication and cloud sync are currently disabled. To enable these features, 
              you'll need to configure Supabase.
            </p>
            
            <div className="space-y-4">
              <div className="bg-white bg-opacity-60 rounded-xl p-4 border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">Quick Setup:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-purple-700">
                  <li>
                    Create a project at{' '}
                    <a 
                      href="https://supabase.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Supabase
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>Get your project URL and anon key from Settings → API</li>
                  <li>Add them to your <code className="bg-purple-100 px-2 py-1 rounded text-xs">.env</code> file</li>
                  <li>Restart the development server</li>
                </ol>
              </div>
              
              <div className="bg-slate-900 rounded-xl p-4 text-green-400 font-mono text-sm relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400"># Add to .env file:</span>
                  <button
                    onClick={handleCopyEnvExample}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="space-y-1">
                  <div>VITE_SUPABASE_URL=<span className="text-yellow-400">your_project_url</span></div>
                  <div>VITE_SUPABASE_ANON_KEY=<span className="text-yellow-400">your_anon_key</span></div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-purple-600">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>All features work locally without authentication!</span>
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setIsVisible(false)}
          className="p-2 rounded-full hover:bg-purple-100 transition-colors"
          title="Dismiss warning"
        >
          <X className="w-5 h-5 text-purple-600" />
        </button>
      </div>
    </div>
  );
}