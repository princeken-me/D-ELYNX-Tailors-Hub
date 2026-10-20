import React from 'react';
import { LucideIcon, PackageOpen } from 'lucide-react';

export interface EmptyStateProps {
  id?: string;
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  id = 'empty-state',
  icon: Icon = PackageOpen,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div
      id={id}
      className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-md mx-auto rounded-2xl border border-zinc-800/60 bg-zinc-900/30"
    >
      <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mb-4 text-amber-400">
        <Icon className="w-7 h-7 stroke-[1.5]" />
      </div>
      <h3 className="font-serif text-base font-semibold tracking-wide text-zinc-100">{title}</h3>
      <p className="mt-2 text-xs text-zinc-400 leading-relaxed max-w-xs">{description}</p>
      {actionLabel && onAction && (
        <button
          id={`${id}-action-btn`}
          onClick={onAction}
          className="mt-6 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-amber-400 hover:text-amber-300 text-xs font-medium tracking-wide transition cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
