'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Compass, ArrowRight, Lock, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import { authApi } from '@/lib/api';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get('token') || '';

  const [token, setToken] = React.useState(tokenParam);
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  React.useEffect(() => {
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [tokenParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token.trim()) {
      setError('Please provide a valid password reset token.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword({
        token: token.trim(),
        password,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. The token may be expired or invalid.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr] trip-bg-mesh">
      {/* Visual Brand Panel */}
      <section className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-950 to-blue-950 text-white">
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

        <Link href="/" className="flex items-center gap-3 relative z-10 w-fit">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur text-white shadow-inner">
            <Compass className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">TripOS</span>
        </Link>

        <div className="max-w-md space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur text-indigo-200">
            <KeyRound className="h-3.5 w-3.5" />
            Set New Password
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Create a fresh, secure password.
          </h1>
          <p className="text-sm text-indigo-200/90 leading-relaxed">
            Ensure your password is at least 8 characters long with a mix of letters and numbers for maximum security.
          </p>
        </div>

        <div className="relative z-10 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur text-xs text-indigo-200">
          <p className="italic">
            &ldquo;Security and privacy are engineered into every layer of TripOS.&rdquo;
          </p>
          <p className="mt-2 font-semibold text-white">— TripOS Security Guarantee</p>
        </div>
      </section>

      {/* Form Panel */}
      <section className="flex flex-col justify-between p-6 sm:p-12 relative">
        <div className="flex items-center justify-between">
          <Link href="/auth/login" className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Login</span>
          </Link>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm my-auto py-8 animate-in fade-in slide-in-from-right-4 duration-300">
          {!isSuccess ? (
            <>
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Set New Password
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Enter your verification token and your new password.
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
                  label="Reset Token"
                  placeholder="Paste your reset token here"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />

                <Input
                  type="password"
                  label="New Password (min 8 characters)"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="h-4 w-4 shrink-0" />}
                  required
                />

                <Input
                  type="password"
                  label="Confirm New Password"
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
                  Update Password & Sign In
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-6 animate-in zoom-in-95 duration-300">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-7 w-7" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Password Updated!
                </h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Your password has been changed securely. You can now sign in to your TripOS account.
                </p>
              </div>

              <Button
                type="button"
                variant="default"
                size="lg"
                className="w-full shadow-glow-primary"
                onClick={() => router.push('/auth/login')}
              >
                Proceed to Sign In
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>

        <div className="text-center text-[11px] text-slate-400">
          TripOS Secure Authentication • Encrypted with TLS & Argon2
        </div>
      </section>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordForm />
    </React.Suspense>
  );
}
