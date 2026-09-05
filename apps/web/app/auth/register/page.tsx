'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Compass, Sparkles, ArrowRight, Lock, Mail, User, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await register(email.trim(), name.trim(), password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr] trip-bg-mesh">
      {/* Visual Brand Panel */}
      <section className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-950 to-blue-950 text-white">
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

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
            Modern Group Travel
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Start your next journey in total sync.
          </h1>
          <p className="text-sm text-indigo-200/90 leading-relaxed">
            Create shared itineraries, split expenses deterministically, and never lose a booking confirmation again.
          </p>

          <div className="space-y-2.5 pt-4 text-xs text-indigo-100">
            {['Free group workspaces for friends & family', 'Real-time multi-device itinerary sync', 'Encrypted vault for flight tickets & vouchers'].map((item) => (
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
            &ldquo;Setting up our Europe summer trip took literally 2 minutes. Everyone loved the itinerary.&rdquo;
          </p>
          <p className="mt-2 font-semibold text-white">— Lucas & Team (Eurotrip 2026)</p>
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
              Create Account
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Set up your TripOS account in 15 seconds.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200">
                {error}
              </div>
            )}

            <Input
              type="text"
              label="Full Name"
              placeholder="e.g. Alex Morgan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<User className="h-4 w-4 shrink-0" />}
              required
            />

            <Input
              type="email"
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="h-4 w-4 shrink-0" />}
              required
            />

            <Input
              type="password"
              label="Password (min 8 characters)"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="h-4 w-4 shrink-0" />}
              required
            />

            <Input
              type="password"
              label="Confirm Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock className="h-4 w-4 shrink-0" />}
              required
            />

            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full mt-2 shadow-glow-primary"
              isLoading={isLoading}
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
              Sign in
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
