'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800/60',
        secondary:
          'bg-slate-100 text-slate-700 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        success:
          'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/60',
        warning:
          'bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/60',
        destructive:
          'bg-red-50 text-red-700 border border-red-200/80 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800/60',
        accent:
          'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm',
        outline:
          'text-foreground border border-border bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'success' && 'bg-emerald-500',
            variant === 'warning' && 'bg-amber-500',
            variant === 'destructive' && 'bg-red-500',
            variant === 'default' && 'bg-indigo-500',
            variant === 'secondary' && 'bg-slate-400',
            variant === 'accent' && 'bg-white'
          )}
        />
      )}
      {children}
    </div>
  );
}
