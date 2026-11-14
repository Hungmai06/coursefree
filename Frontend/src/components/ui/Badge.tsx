import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'muted';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide uppercase',
        {
          'bg-slate-100 text-slate-700 border border-slate-200':
            variant === 'default',
          'bg-blue-50 text-blue-700 border border-blue-200': variant === 'accent',
          'bg-emerald-50 text-emerald-700 border border-emerald-200':
            variant === 'success',
          'bg-amber-50 text-amber-700 border border-amber-200':
            variant === 'warning',
          'bg-slate-100 text-slate-500 border border-slate-200':
            variant === 'muted',
        },
        className
      )}
    >
      {children}
    </span>
  );
}

export function ProgressBar({
  value,
  max = 100,
  className,
  showLabel = false,
}: {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div className={cn('w-full flex items-center gap-2', className)}>
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono text-slate-500">
          {percentage}%
        </span>
      )}
    </div>
  );
}
