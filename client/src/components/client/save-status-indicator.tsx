import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Wifi, 
  WifiOff, 
  Clock,
  Save
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SaveState {
  status: 'idle' | 'saving' | 'success' | 'error';
  message?: string;
  lastSaveTime?: Date;
}

interface ConnectionStatus {
  speed: 'fast' | 'medium' | 'slow' | 'offline';
  estimatedSaveTime: number;
}

interface SaveStatusIndicatorProps {
  saveState: SaveState;
  connectionStatus: ConnectionStatus;
  unsavedCount: number;
  isSaving: boolean;
  className?: string;
}

export function SaveStatusIndicator({ 
  saveState, 
  connectionStatus, 
  unsavedCount, 
  isSaving, 
  className = "" 
}: SaveStatusIndicatorProps) {
  const getConnectionIcon = () => {
    switch (connectionStatus.speed) {
      case 'fast':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'medium':
        return <Wifi className="w-4 h-4 text-yellow-500" />;
      case 'slow':
        return <Wifi className="w-4 h-4 text-orange-500" />;
      case 'offline':
        return <WifiOff className="w-4 h-4 text-red-500" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus.speed) {
      case 'fast': return 'Fast';
      case 'medium': return 'Good';
      case 'slow': return 'Slow';
      case 'offline': return 'Offline';
    }
  };

  const getSaveEstimate = () => {
    if (connectionStatus.speed === 'offline') return 'Retrying...';
    const seconds = Math.ceil(connectionStatus.estimatedSaveTime / 1000);
    return `~${seconds}s to save`;
  };

  const formatLastSaveTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex items-center gap-3 text-sm ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center gap-1.5">
        {getConnectionIcon()}
        <span className="text-muted-foreground">{getConnectionText()}</span>
      </div>

      {/* Save Status */}
      <div className="flex items-center gap-2">
        {saveState.status === 'saving' && (
          <div className="flex items-center gap-1.5">
            <Loader2 className="w-4 h-4 animate-spin text-cyan" />
            <span className="text-cyan">
              Saving... ({getSaveEstimate()})
            </span>
          </div>
        )}

        {saveState.status === 'success' && (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-green-500">{saveState.message}</span>
            {saveState.lastSaveTime && (
              <span className="text-muted-foreground text-xs">
                • {formatLastSaveTime(saveState.lastSaveTime)}
              </span>
            )}
          </div>
        )}

        {saveState.status === 'error' && (
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-red-500">{saveState.message || 'Save failed'}</span>
          </div>
        )}

        {saveState.status === 'idle' && unsavedCount > 0 && (
          <div className="flex items-center gap-1.5">
            <Save className="w-4 h-4 text-orange-500" />
            <span className="text-orange-500">
              {unsavedCount} unsaved change{unsavedCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {saveState.status === 'idle' && unsavedCount === 0 && saveState.lastSaveTime && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground text-xs">
              Last saved {formatLastSaveTime(saveState.lastSaveTime)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface InlineSaveButtonProps {
  onSave: () => void;
  saveState: SaveState;
  unsavedCount: number;
  isSaving: boolean;
  disabled?: boolean;
}

export function InlineSaveButton({ 
  onSave, 
  saveState, 
  unsavedCount, 
  isSaving, 
  disabled = false 
}: InlineSaveButtonProps) {
  const isDisabled = disabled || unsavedCount === 0 || isSaving;

  if (unsavedCount === 0 && saveState.status === 'idle') {
    return null; // Don't show save button when nothing to save
  }

  return (
    <button
      onClick={onSave}
      disabled={isDisabled}
      className="flex items-center gap-1.5 text-sm text-cyan hover:text-cyan/80 disabled:opacity-50 disabled:cursor-not-allowed"
      title={
        unsavedCount === 0 
          ? 'No changes to save' 
          : `Save ${unsavedCount} selection${unsavedCount !== 1 ? 's' : ''}`
      }
    >
      {isSaving ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Save className="w-4 h-4" />
      )}
      
      <span>
        {isSaving ? 'Saving...' : 'Save now'}
      </span>
      
      {unsavedCount > 0 && !isSaving && (
        <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
          {unsavedCount}
        </span>
      )}
    </button>
  );
}

interface CompactSaveRowProps {
  connectionStatus: ConnectionStatus;
  unsavedCount: number;
  isSaving: boolean;
  onSave: () => void;
  saveState: SaveState;
  countdown: number;
}

export function CompactSaveRow({
  connectionStatus,
  unsavedCount,
  isSaving,
  onSave,
  saveState,
  countdown
}: CompactSaveRowProps) {
  const getConnectionIcon = () => {
    switch (connectionStatus.speed) {
      case 'fast':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'medium':
        return <Wifi className="w-4 h-4 text-yellow-500" />;
      case 'slow':
        return <Wifi className="w-4 h-4 text-orange-500" />;
      case 'offline':
        return <WifiOff className="w-4 h-4 text-red-500" />;
    }
  };

  const getConnectionSpeed = () => {
    switch (connectionStatus.speed) {
      case 'fast': return 'Fast';
      case 'medium': return 'Good';
      case 'slow': return 'Slow';
      case 'offline': return 'Offline';
    }
  };

  const getButtonText = () => {
    if (isSaving) return 'Saving...';
    if (unsavedCount === 0) return 'All saved';
    
    // Simple save button text
    return 'Save changes';
  };

  return (
    <div className="flex items-center gap-3 text-sm">
      {/* Single button spanning full width */}
      <button
        onClick={onSave}
        disabled={unsavedCount === 0 || isSaving}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan/10 text-cyan rounded-lg hover:bg-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
        {saveState.status === 'success' && !isSaving && (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        )}
        {saveState.status === 'error' && (
          <AlertCircle className="w-4 h-4 text-red-500" />
        )}
        
        <span className="text-center">{getButtonText()}</span>
      </button>
    </div>
  );
}