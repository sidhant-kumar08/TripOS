'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-900">
        <div className="max-w-xl rounded-3xl border border-red-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">Application error</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">TripOS could not render this page.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The issue was logged and the app can be retried without losing your session.
          </p>
          <div className="mt-6">
            <button type="button" onClick={reset} className="trip-button px-5 py-2.5">
              Reload app
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}