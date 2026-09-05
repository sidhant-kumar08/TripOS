'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'trip-glass-card flex flex-col items-center justify-center p-10 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800',
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 text-3xl shadow-inner dark:from-indigo-950/60 dark:to-blue-950/60 text-indigo-600 dark:text-indigo-400 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <Button onClick={onAction} variant="default" size="default">
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button onClick={onSecondaryAction} variant="secondary" size="default">
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
