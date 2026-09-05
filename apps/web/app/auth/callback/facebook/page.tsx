'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { FacebookIcon } from '@/components/auth/social-auth';
import { Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function FacebookCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();

  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    if (errorParam) {
      setStatus('error');
      setErrorMessage(errorDescription || `Facebook authentication was cancelled or failed: ${errorParam}`);
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMessage('No authorization code was provided by Facebook.');
      return;
    }

    const exchangeCode = async () => {
      try {
        const redirectUri = `${window.location.origin}/auth/callback/facebook`;
        const res = await authApi.facebookCallback({
          code,
          redirectUri,
        });

        setSession(res.data.accessToken, res.data.user);
        setStatus('success');

        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 400);
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(
          err.response?.data?.message ||
            'Failed to complete Facebook Sign-In. Please check that your Facebook App credentials are configured correctly.'
        );
      }
    };

    exchangeCode();
  }, [code, errorParam, errorDescription, router, setSession]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 trip-bg-mesh">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl text-center space-y-6 animate-in zoom-in-95 duration-200">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 shadow-md border border-slate-200/80 dark:border-slate-700">
          <FacebookIcon className="h-8 w-8" />
        </div>

        {status === 'loading' && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              Authenticating with Facebook
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verifying your Facebook credentials and preparing your trip workspace...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Sign In Successful!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Redirecting you to your dashboard...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <h2 className="text-lg font-bold">Facebook Sign-In Error</h2>
            </div>
            <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/50 p-4 text-xs text-red-700 dark:text-red-200 text-left">
              {errorMessage}
            </div>
            <div className="pt-2">
              <Link href="/auth/login">
                <Button variant="default" size="default" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Return to Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FacebookCallbackPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center trip-bg-mesh">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <FacebookCallbackContent />
    </React.Suspense>
  );
}
