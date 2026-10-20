import React from 'react';

export interface LoadingStateProps {
  label?: string;
  sublabel?: string;
  variant?: 'fullscreen' | 'inline' | 'card';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Loading Atelier Records',
  sublabel = 'Connecting to D-ELYNX ecosystem...',
  variant = 'inline',
}) => {
  if (variant === 'fullscreen') {
    return (
      <div
        id="loading-state-fullscreen"
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm p-6 text-center"
      >
        <div className="relative flex items-center justify-center w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 animate-ping" />
          <div className="w-12 h-12 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          <span className="font-serif font-bold text-amber-400 text-sm">D</span>
        </div>
        <p className="font-serif tracking-widest uppercase text-sm font-medium text-zinc-100">{label}</p>
        {sublabel && <p className="mt-1 text-xs text-zinc-400 font-sans">{sublabel}</p>}
      </div>
    );
  }

  return (
    <div
      id="loading-state-inline"
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="relative flex items-center justify-center w-10 h-10 mb-3">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" />
      </div>
      <p className="text-xs font-serif tracking-wider uppercase text-zinc-300 font-semibold">{label}</p>
      {sublabel && <p className="mt-1 text-xs text-zinc-500">{sublabel}</p>}
    </div>
  );
};
