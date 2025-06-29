import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, Sync, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { syncLocalDataToDatabase } from '../services/thoughtsService';

export default function CloudSyncIndicator() {
  const { user, isConfigured } = useAuth();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Auto-sync when user logs in
    if (user && syncStatus === 'idle') {
      handleSync();
    }
  }, [user]);

  const handleSync = async () => {
    if (!user) return;

    setSyncStatus('syncing');
    setSyncMessage('Syncing your data...');

    try {
      const result = await syncLocalDataToDatabase(user.id);
      
      if (result.thoughts > 0 || result.favorites > 0) {
        setSyncStatus('success');
        setSyncMessage(`Synced ${result.thoughts} thoughts and ${result.favorites} favorites`);
      } else {
        setSyncStatus('success');
        setSyncMessage('All data is up to date');
      }

      setTimeout(() => {
        setSyncStatus('idle');
        setSyncMessage('');
      }, 3000);
    } catch (error) {
      setSyncStatus('error');
      setSyncMessage('Sync failed. Please try again.');
      
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncMessage('');
      }, 5000);
    }
  };

  if (!isConfigured) {
    return null;
  }

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <Sync className="w-4 h-4 animate-spin" />;
      case 'success':
        return <Check className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return user ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return user 
          ? 'text-blue-600 bg-blue-50 border-blue-200'
          : 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStatusText = () => {
    if (syncMessage) return syncMessage;
    
    if (user) {
      return 'Cloud sync enabled';
    } else {
      return 'Local storage only';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium transition-all duration-300 ${getStatusColor()}`}
      >
        {getStatusIcon()}
        <span className="hidden sm:inline">{getStatusText()}</span>
      </button>

      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Data Sync Status</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {user ? (
                  <>
                    <Cloud className="w-4 h-4 text-blue-500" />
                    <span className="text-slate-700">Signed in as {user.email}</span>
                  </>
                ) : (
                  <>
                    <CloudOff className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700">Not signed in</span>
                  </>
                )}
              </div>
              
              <div className="text-slate-600">
                {user 
                  ? 'Your thoughts are automatically synced to the cloud'
                  : 'Your thoughts are saved locally on this device'
                }
              </div>
            </div>

            {user && syncStatus !== 'syncing' && (
              <button
                onClick={handleSync}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                <Sync className="w-4 h-4" />
                Sync Now
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}