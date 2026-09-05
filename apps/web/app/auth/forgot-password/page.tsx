'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Compass, ArrowRight, Mail, KeyRound, ArrowLeft, CheckCircle2, Copy, Check } from 'lucide-react';
import { authApi } from '@/lib/api';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [generatedToken, setGeneratedToken] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await authApi.forgotPassword(email.trim());
      setIsSuccess(true);
      if (res.data?.resetToken) {
        setGeneratedToken(res.data.resetToken);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request password reset. Please check your email.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr] trip-bg-mesh">
      {/* Visual Brand Panel */}
      <section className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-950 to-blue-950 text-white">
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
            <KeyRound className="h-3.5 w-3.5" />
            Account Security & Recovery
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Regain access to your trips in seconds.
          </h1>
          <p className="text-sm text-indigo-200/90 leading-relaxed">
            Forgot your password? No worries. Request a secure reset token to safely set a new password and jump right back into your travel plans.
          </p>
        </div>

        {/* Bottom review quote */}
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
                  Reset Password
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Enter your account email to receive your password reset token.
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
                  label="Registered Email Address"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="h-4 w-4 shrink-0" />}
                  required
                />

                <Button
                  type="submit"
                  variant="default"
                  size="lg"
                  className="w-full mt-2 shadow-glow-primary"
                  isLoading={isLoading}
                >
                  Send Reset Link
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
                  Reset Token Generated!
                </h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  We have generated a password reset authorization for <strong className="text-slate-800 dark:text-slate-200">{email}</strong>.
                </p>
              </div>

              {generatedToken && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">
                      One-Click Dev Token
                    </span>
                    <button
                      type="button"
                      onClick={copyToken}
                      className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="font-mono text-xs break-all bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    {generatedToken}
                  </p>
                </div>
              )}

              <div className="space-y-2.5">
                <Button
                  type="button"
                  variant="default"
                  size="lg"
                  className="w-full shadow-glow-primary"
                  onClick={() => router.push(`/auth/reset-password?token=${generatedToken || ''}`)}
                >
                  Set New Password Now
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-slate-600 dark:text-slate-400"
                  onClick={() => setIsSuccess(false)}
                >
                  Try another email
                </Button>
              </div>
            </div>
          )}

          <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
            Remembered your password?{' '}
            <Link href="/auth/login" className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
              Sign In
            </Link>
          </p>
        </div>

        <div className="text-center text-[11px] text-slate-400">
          TripOS Secure Authentication • 256-bit token encryption
        </div>
      </section>
    </div>
  );
}
