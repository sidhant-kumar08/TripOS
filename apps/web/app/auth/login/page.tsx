'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_28%),linear-gradient(180deg,_#0f172a_0%,_#1e293b_100%)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3 text-lg font-semibold">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-xl backdrop-blur">🧭</span>
          TripOS
        </div>
        <div className="max-w-xl space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200/90">Welcome back</p>
          <h1 className="text-5xl font-semibold tracking-tight">Manage the whole trip from one place.</h1>
          <p className="text-lg leading-8 text-slate-200">
            Sign in to access trips, itinerary planning, expense settlement, and secure file storage.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {['Trips', 'Balances', 'Vault'].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-sm font-semibold">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-10">
        <div className="w-full max-w-md trip-card">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">TripOS Access</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Sign in</h2>
            <p className="mt-2 text-sm text-slate-500">Use your TripOS account to continue.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="trip-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="trip-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="trip-button w-full">
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>

            <p className="text-center text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="font-semibold text-blue-600 hover:text-blue-700">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
