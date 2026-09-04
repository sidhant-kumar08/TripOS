'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

export function PageShell({
  title,
  subtitle,
  children,
  backHref,
  backLabel = 'Back',
  actions,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_35%),linear-gradient(180deg,_#f8fbff_0%,_#f4f7fb_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between gap-4 rounded-3xl border border-white/70 bg-white/80 px-5 py-4 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur">
          <div>
            {backHref ? (
              <Link href={backHref} className="mb-2 inline-flex items-center text-sm font-medium text-blue-600 transition hover:text-blue-700">
                ← {backLabel}
              </Link>
            ) : null}
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-slate-500 sm:text-base">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
        </header>
        <main className="flex-1 pb-8">{children}</main>
      </div>
    </div>
  );
}
