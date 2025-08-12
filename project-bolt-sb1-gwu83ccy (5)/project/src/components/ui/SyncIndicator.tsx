import React from 'react';
import { Wifi, WifiOff, Loader } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const SyncIndicator: React.FC = () => {
  const { connectionStatus } = useAppContext();

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      case 'reconnecting':
        return <Loader className="w-4 h-4 text-yellow-500 animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Synced';
      case 'disconnected':
        return 'Offline';
      case 'reconnecting':
        return 'Syncing...';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600';
      case 'disconnected':
        return 'text-red-600';
      case 'reconnecting':
        return 'text-yellow-600';
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {getStatusIcon()}
      <span className={`text-xs font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
    </div>
  );
};

export default SyncIndicator;