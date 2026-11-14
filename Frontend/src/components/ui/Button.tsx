import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
          {
            // Primary: Vibrant blue with white text
            'bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-xs':
              variant === 'primary',
            // Secondary: Clean white with slate border
            'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-xs':
              variant === 'secondary',
            // Outline: border only
            'border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50':
              variant === 'outline',
            // Ghost: transparent
            'text-slate-600 hover:text-slate-900 hover:bg-slate-100':
              variant === 'ghost',
            // Danger: error red
            'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100':
              variant === 'danger',
          },
          {
            'h-8 px-3 text-xs rounded-btn gap-1.5': size === 'sm',
            'h-9 px-4 text-sm rounded-btn gap-2': size === 'md',
            'h-11 px-5 text-base rounded-btn gap-2.5': size === 'lg',
            'h-9 w-9 p-0 rounded-btn': size === 'icon',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
