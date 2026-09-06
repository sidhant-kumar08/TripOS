'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Compass, Sparkles, ArrowRight, Lock, Mail, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SocialAuthButtons } from '@/components/auth/social-auth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email.trim(), password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr] trip-bg-mesh">
      {/* Visual Brand Panel */}
      <section className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 text-white">
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

        {/* Top brand */}
        <Link href="/" className="flex items-center gap-3 relative z-10 w-fit">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur text-white shadow-inner">
            <Compass className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">TripOS</span>
        </Link>

        {/* Hero content */}
        <div className="max-w-md space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur text-indigo-200">
            <Sparkles className="h-3.5 w-3.5" />
            Seamless Group Coordination
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Welcome back to your travel hub.
          </h1>
          <p className="text-sm text-indigo-200/90 leading-relaxed">
            Access your shared itineraries, transparent expense ledgers, and secure trip files with 100% confidence.
          </p>

          <div className="space-y-2.5 pt-4 text-xs text-indigo-100">
            {['Zero math arguments with automated settlement', 'Shared itinerary timeline with live updates', 'Centralized document vault for tickets & vouchers'].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/30 text-emerald-300">
                  <Check className="h-3 w-3" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom review quote */}
        <div className="relative z-10 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur text-xs text-indigo-200">
          <p className="italic">
            &ldquo;TripOS completely changed how our group of 6 travels. No more awkward IOU texts.&rdquo;
          </p>
          <p className="mt-2 font-semibold text-white">— Maya & Friends (Kyoto Trip)</p>
        </div>
      </section>

      {/* Form Panel */}
      <section className="flex flex-col justify-between p-6 sm:p-12 relative">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 dark:text-white lg:hidden">
            <Compass className="h-5 w-5 text-indigo-600" />
            <span>TripOS</span>
          </Link>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm my-auto py-8 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sign In
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Enter your credentials to access your trips.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200">
                {error}
              </div>
            )}

            <Input
              type="email"
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="h-4 w-4 shrink-0" />}
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Password</span>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="h-4 w-4 shrink-0" />}
                required
              />
            </div>

            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full mt-2 shadow-glow-primary"
              isLoading={isLoading}
            >
              Sign In to TripOS
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6">
            <SocialAuthButtons />
          </div>

          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
              Create an account
            </Link>
          </p>
        </div>

        <div className="text-center text-[11px] text-slate-400">
          TripOS Secure Authentication • Encrypted with TLS & JWT
        </div>
      </section>
    </div>
  );
}
