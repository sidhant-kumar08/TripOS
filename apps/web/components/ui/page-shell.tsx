'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Navbar } from '@/components/shared/navbar';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function PageShell({
  title,
  subtitle,
  children,
  backHref,
  backLabel = 'Back',
  breadcrumbs,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col trip-bg-mesh">
      <Navbar />

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header section with back / breadcrumbs and actions */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            {/* Breadcrumbs or Back button */}
            {breadcrumbs && breadcrumbs.length > 0 ? (
              <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                    {crumb.href ? (
                      <Link
                        href={crumb.href}
                        className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-slate-900 dark:text-slate-200 font-semibold">
                        {crumb.label}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            ) : backHref ? (
              <Link
                href={backHref}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {backLabel}
              </Link>
            ) : null}

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex flex-wrap items-center gap-2.5 sm:self-start">
              {actions}
            </div>
          )}
        </div>

        {/* Main Content */}
        <main className={cn('pb-12', className)}>{children}</main>
      </div>

      {/* Subtle Footer */}
      <footer className="border-t border-slate-200/60 bg-white/40 py-6 text-center text-xs text-slate-400 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>TripOS — Group Travel Operating System</span>
          <span>Designed with precision & simplicity</span>
        </div>
      </footer>
    </div>
  );
}
