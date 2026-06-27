import React, { useState, useEffect } from 'react';
import { getApiKey, setApiKey, searchPlayers, ApiError } from '../services/api';
import { Shield, ShieldAlert, ShieldCheck, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';

interface ApiKeyStatusProps {
  onStatusChange?: (status: 'connected' | 'error' | 'not_set') => void;
  triggerCheckKey?: number; // Counter to force a re-check from external components
}

export const ApiKeyStatus: React.FC<ApiKeyStatusProps> = ({ onStatusChange, triggerCheckKey = 0 }) => {
  const [key, setKeyVal] = useState('');
  const [status, setStatus] = useState<'connected' | 'error' | 'not_set'>('not_set');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load key on mount and verify it
  useEffect(() => {
    const currentKey = getApiKey();
    setKeyVal(currentKey);
    if (currentKey) {
      verifyKey(currentKey);
    } else {
      setStatus('not_set');
      onStatusChange?.('not_set');
    }
  }, [triggerCheckKey]);

  const verifyKey = async (testKey: string) => {
    if (!testKey) {
      setStatus('not_set');
      onStatusChange?.('not_set');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      // Run a simple player search to verify the key works
      await searchPlayers('Jordan', undefined, 1);
      setStatus('connected');
      onStatusChange?.('connected');
    } catch (err) {
      setStatus('error');
      onStatusChange?.('error');
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to connect to the API.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setApiKey(key);
    setIsEditing(false);
    verifyKey(key);
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Connected
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            Connection Error
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            Key Not Set
          </div>
        );
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 md:p-6 mb-6 glow-blue transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl ${status === 'connected' ? 'bg-emerald-500/10 text-emerald-400' : status === 'error' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-500/10 text-slate-400'}`}>
            {status === 'connected' ? (
              <ShieldCheck className="w-6 h-6" />
            ) : status === 'error' ? (
              <ShieldAlert className="w-6 h-6" />
            ) : (
              <Shield className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-lg text-slate-100 flex items-center gap-2">
              balldontlie.io API Connection
              {loading && <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Requires a v1 API Key to request player data, averages, and historical matches.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {getStatusBadge()}
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-semibold px-4 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 border border-slate-700/50 rounded-xl transition duration-200"
            >
              Configure Key
            </button>
          ) : (
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64 min-w-[200px]">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showKey ? 'text' : 'password'}
                  value={key}
                  onChange={(e) => setKeyVal(e.target.value)}
                  placeholder="Enter API Key"
                  className="w-full text-sm pl-10 pr-10 py-2 bg-slate-900/80 border border-slate-700 rounded-xl focus:border-orange-500 focus:outline-none text-slate-100 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleSave}
                  className="text-xs font-semibold px-4 py-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-xl transition duration-200"
                >
                  Save & Connect
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setKeyVal(getApiKey());
                  }}
                  className="text-xs font-semibold px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {status === 'error' && errorMessage && (
        <div className="mt-3 text-xs text-rose-400/90 bg-rose-500/5 border border-rose-500/10 px-3.5 py-2.5 rounded-xl">
          <strong>Connection error:</strong> {errorMessage}
        </div>
      )}
    </div>
  );
};
