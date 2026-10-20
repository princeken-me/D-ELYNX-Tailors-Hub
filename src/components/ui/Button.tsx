import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold-outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-medium tracking-wide transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none min-h-[44px]';

  const sizeClasses = {
    sm: 'px-4 py-2 text-xs gap-1.5 min-h-[38px]',
    md: 'px-5 py-2.5 text-sm gap-2 min-h-[44px]',
    lg: 'px-6 py-3 text-sm font-semibold tracking-wider uppercase gap-2.5 min-h-[48px]',
  }[size];

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-[#D4AF37] to-[#C59B27] hover:from-[#E5C358] hover:to-[#D4AF37] text-zinc-950 font-semibold shadow-md shadow-amber-950/40 hover:shadow-[#D4AF37]/20 active:translate-y-px',
    secondary:
      'bg-[#18181B] hover:bg-zinc-800 text-zinc-100 border border-[#27272A] hover:border-zinc-600 active:translate-y-px',
    outline:
      'border border-[#27272A] text-zinc-300 hover:text-white hover:bg-[#18181B] hover:border-zinc-600 active:translate-y-px',
    'gold-outline':
      'border border-[#D4AF37]/50 text-amber-300 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] active:translate-y-px',
    ghost:
      'text-zinc-400 hover:text-zinc-100 hover:bg-[#18181B]/60 active:translate-y-px',
  }[variant];

  return (
    <button
      disabled={disabled || isLoading}
      className={`${base} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-2" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

