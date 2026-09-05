'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  ChevronRight,
  Compass,
  Calendar,
  DollarSign,
  FileText,
} from 'lucide-react';
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
  const pathname = usePathname();

  // Extract tripId if currently in a trip sub-route
  const tripMatch = pathname.match(/^\/trips\/([^/]+)/);
  const tripId = tripMatch ? tripMatch[1] : null;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col trip-bg-mesh pb-20 md:pb-0">
      <Navbar />

      <div className="mx-auto w-full max-w-7xl flex-1 px-3.5 py-4 sm:px-6 sm:py-8 lg:px-8">
        {/* Header section with back / breadcrumbs and actions */}
        <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5 sm:space-y-2 min-w-0">
            {/* Breadcrumbs or Back button */}
            {breadcrumbs && breadcrumbs.length > 0 ? (
              <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />}
                    {crumb.href ? (
                      <Link
                        href={crumb.href}
                        className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition truncate max-w-[150px] sm:max-w-none"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-slate-900 dark:text-slate-200 font-semibold truncate max-w-[180px] sm:max-w-none">
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

            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white break-words">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex flex-wrap items-center gap-2 sm:self-start pt-1 sm:pt-0">
              {actions}
            </div>
          )}
        </div>

        {/* Main Content */}
        <main className={cn('pb-8', className)}>{children}</main>
      </div>

      {/* Mobile Sticky Bottom Trip Navigation Bar */}
      {tripId && (
        <div className="fixed bottom-3 inset-x-3 z-40 md:hidden">
          <nav className="mx-auto flex items-center justify-around rounded-2xl border border-white/60 dark:border-white/10 bg-white/90 dark:bg-slate-950/90 p-1.5 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] backdrop-blur-2xl">
            <Link
              href={`/trips/${tripId}`}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl text-[10px] font-semibold transition-all active:scale-95',
                pathname === `/trips/${tripId}`
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-300 shadow-sm font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Compass className="h-4 w-4 mb-0.5" />
              <span>Overview</span>
            </Link>

            <Link
              href={`/trips/${tripId}/itinerary`}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl text-[10px] font-semibold transition-all active:scale-95',
                pathname === `/trips/${tripId}/itinerary`
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-300 shadow-sm font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Calendar className="h-4 w-4 mb-0.5" />
              <span>Itinerary</span>
            </Link>

            <Link
              href={`/trips/${tripId}/expenses`}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl text-[10px] font-semibold transition-all active:scale-95',
                pathname === `/trips/${tripId}/expenses`
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-300 shadow-sm font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <DollarSign className="h-4 w-4 mb-0.5" />
              <span>Expenses</span>
            </Link>

            <Link
              href={`/trips/${tripId}/vault`}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl text-[10px] font-semibold transition-all active:scale-95',
                pathname === `/trips/${tripId}/vault`
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-300 shadow-sm font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <FileText className="h-4 w-4 mb-0.5" />
              <span>Vault</span>
            </Link>
          </nav>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-white/40 py-5 text-center text-xs text-slate-400 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>TripOS — Group Travel Operating System</span>
          <span>Designed with precision & simplicity</span>
        </div>
      </footer>
    </div>
  );
}
