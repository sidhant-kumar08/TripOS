'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      await register(email, name, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
      <section className="order-2 flex items-center justify-center px-4 py-12 sm:px-6 lg:order-1 lg:px-10">
        <div className="w-full max-w-md trip-card">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Create account</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Join TripOS</h2>
            <p className="mt-2 text-sm text-slate-500">Create a workspace for your group trip.</p>
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
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="trip-input"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="trip-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="mt-2 text-xs text-slate-500">At least 8 characters</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-700">Confirm password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="trip-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="trip-button w-full">
              {isLoading ? 'Creating account...' : 'Sign up'}
            </button>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold text-blue-600 hover:text-blue-700">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </section>

      <section className="order-1 hidden bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.2),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3 text-lg font-semibold">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-xl backdrop-blur">🧭</span>
          TripOS
        </div>
        <div className="max-w-xl space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200/90">Built for groups</p>
          <h1 className="text-5xl font-semibold tracking-tight">Plan trips, split costs, and share files with clarity.</h1>
          <p className="text-lg leading-8 text-slate-200">
            TripOS keeps travel coordination structured, auditable, and easy to use from desktop or mobile.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ['Fast setup', 'Create a trip in seconds'],
            ['Secure access', 'Invite-only shared workspace'],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="font-semibold">{title}</p>
              <p className="mt-1 text-sm text-slate-200">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
