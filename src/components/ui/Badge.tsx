import React from 'react';

export interface BadgeProps {
  id?: string;
  variant?: 'gold' | 'default' | 'outline' | 'success' | 'warning';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  id,
  variant = 'default',
  size = 'sm',
  children,
  className = '',
}) => {
  const base = 'inline-flex items-center font-medium rounded-full tracking-wider uppercase transition-colors';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  }[size];

  const variantClasses = {
    gold: 'bg-amber-500/10 text-amber-300 border border-amber-500/30',
    default: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
    outline: 'border border-zinc-700 text-zinc-400',
    success: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30',
    warning: 'bg-orange-500/10 text-orange-300 border border-orange-500/30',
  }[variant];

  return (
    <span id={id} className={`${base} ${sizeClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
};
