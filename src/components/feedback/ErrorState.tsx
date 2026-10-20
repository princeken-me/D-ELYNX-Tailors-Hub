import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export interface ErrorStateProps {
  id?: string;
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  id = 'error-state',
  title = 'Service Interruption',
  message = 'Unable to synchronize with the fashion ecosystem data layer. Please verify connectivity or credentials.',
  onRetry,
}) => {
  return (
    <div
      id={id}
      className="flex flex-col items-center justify-center py-12 px-6 text-center max-w-md mx-auto rounded-2xl border border-red-500/20 bg-red-950/10"
    >
      <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-3 text-red-400">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="font-serif text-sm font-semibold tracking-wide text-zinc-100">{title}</h3>
      <p className="mt-2 text-xs text-zinc-400 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          id={`${id}-retry-btn`}
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
};
