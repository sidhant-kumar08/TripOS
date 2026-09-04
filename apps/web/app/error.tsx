'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="max-w-xl rounded-3xl border border-red-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">Something went wrong</p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900">We hit an unexpected issue.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The app logged the error and you can try again safely.
        </p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={reset} className="trip-button px-5 py-2.5">
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}