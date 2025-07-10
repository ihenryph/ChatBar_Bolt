import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Mostrar status inicial se offline
    if (!navigator.onLine) {
      setShowStatus(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showStatus) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isOnline ? 'animate-bounce' : 'animate-pulse'
    }`}>
      <div className={`glass rounded-lg p-3 border-2 ${
        isOnline 
          ? 'border-green-400/50 bg-green-900/30' 
          : 'border-red-400/50 bg-red-900/30'
      }`}>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400" />
          )}
          <span className={`text-xs font-mono ${
            isOnline ? 'text-green-300' : 'text-red-300'
          }`}>
            {isOnline ? 'CONECTADO' : 'SEM CONEXÃO'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;