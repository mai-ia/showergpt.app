import React from 'react';
import { Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { getApiUsageStats } from '../services/openaiService';

export default function ApiUsageIndicator() {
  const stats = getApiUsageStats();
  
  const getStatusColor = () => {
    if (stats.callsRemaining === 0) return 'text-red-600 bg-red-50 border-red-200';
    if (stats.callsRemaining <= 2) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };
  
  const getStatusIcon = () => {
    if (stats.callsRemaining === 0) return <AlertTriangle className="w-4 h-4" />;
    if (stats.callsRemaining <= 2) return <Zap className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium ${getStatusColor()}`}>
      {getStatusIcon()}
      <span>
        {stats.callsRemaining} AI calls remaining
        {stats.resetTime && (
          <span className="ml-1 opacity-75">
            (resets at {stats.resetTime})
          </span>
        )}
      </span>
    </div>
  );
}