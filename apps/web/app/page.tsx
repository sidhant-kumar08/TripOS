'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)]">
      <header className="sticky top-0 z-20 border-b border-white/50 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 font-semibold text-slate-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg text-white shadow-lg shadow-blue-600/25">
              🧭
            </span>
            <span className="text-xl tracking-tight">TripOS</span>
          </Link>

          <nav className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="trip-button-secondary px-4 py-2">
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    localStorage.removeItem('accessToken');
                    router.push('/');
                  }}
                  className="trip-button-secondary px-4 py-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900">
                  Login
                </Link>
                <Link href="/auth/register" className="trip-button px-5 py-2.5">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 lg:px-8 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              MVP ready for deployment
            </div>

            <div className="space-y-6">
              <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
                One workspace for every group trip.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                TripOS replaces scattered chats, notes, spreadsheets, and expense apps with a single polished trip operating system.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              {isAuthenticated ? (
                <Link href="/dashboard" className="trip-button px-6 py-3.5">
                  Open Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/auth/register" className="trip-button px-6 py-3.5">
                    Get Started
                  </Link>
                  <Link href="/auth/login" className="trip-button-secondary px-6 py-3.5">
                    Sign In
                  </Link>
                </>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ['Trips', 'Create and manage every trip in one place'],
                ['Itinerary', 'Schedule activities and assign tasks'],
                ['Expenses', 'Split costs and settle balances confidently'],
              ].map(([title, desc]) => (
                <div key={title} className="trip-card trip-card-hover">
                  <p className="text-sm font-semibold text-blue-600">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="trip-card relative overflow-hidden border-white/80 p-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-indigo-600/10" />
            <div className="relative space-y-6 p-8 sm:p-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Trip workspace</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Everything the group needs</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
                  ✨
                </div>
              </div>

              <div className="space-y-4">
                {[
                  ['Secure access', 'JWT auth and protected member access'],
                  ['Deterministic balances', 'Auditable settlement suggestions'],
                  ['Minimal vault', 'Trip files stored in one secure place'],
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                    <p className="font-semibold text-slate-900">{title}</p>
                    <p className="mt-1 text-sm text-slate-600">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
