'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: {
    text: string;
    isPositive?: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'indigo';
  className?: string;
}

export function StatCard({
  label,
  value,
  subtext,
  icon,
  trend,
  variant = 'default',
  className,
}: StatCardProps) {
  const variantStyles = {
    default: 'border-slate-200/80 dark:border-slate-800',
    success: 'border-emerald-200/80 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/20',
    warning: 'border-amber-200/80 bg-amber-50/30 dark:border-amber-900/50 dark:bg-amber-950/20',
    indigo: 'border-indigo-200/80 bg-indigo-50/30 dark:border-indigo-900/50 dark:bg-indigo-950/20',
  };

  const iconStyles = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300',
  };

  return (
    <div
      className={cn(
        'trip-glass-card rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {icon && (
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl text-base shadow-sm', iconStyles[variant])}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full',
              trend.isPositive
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            )}
          >
            {trend.text}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {subtext}
        </p>
      )}
    </div>
  );
}
