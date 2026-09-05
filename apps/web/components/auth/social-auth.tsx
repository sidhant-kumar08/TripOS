'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { authApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export function GoogleIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export function FacebookIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

declare global {
  interface Window {
    google?: any;
  }
}

export function SocialAuthButtons() {
  const router = useRouter();
  const { updateUser } = useAuth();
  const [loadingProvider, setLoadingProvider] = React.useState<'google' | 'facebook' | null>(null);

  // Initialize official Google Identity Services (One-Tap prompt)
  React.useEffect(() => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!googleClientId) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            if (response.credential) {
              try {
                setLoadingProvider('google');
                const res = await authApi.googleVerifyToken({ idToken: response.credential });
                localStorage.setItem('accessToken', res.data.accessToken);
                updateUser(res.data.user);
                router.push('/dashboard');
              } catch (err) {
                console.error('Google One Tap sign in failed:', err);
              } finally {
                setLoadingProvider(null);
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Prompt Google One Tap widget
        window.google.accounts.id.prompt();
      }
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [router, updateUser]);

  const [authError, setAuthError] = React.useState<string | null>(null);

  const handleGoogleLogin = () => {
    setAuthError(null);
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setAuthError('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured in .env.local.');
      return;
    }

    setLoadingProvider('google');
    const redirectUri = `${window.location.origin}/auth/callback/google`;

    const googleAuthUrl =
      'https://accounts.google.com/o/oauth2/v2/auth?' +
      new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'select_account',
      }).toString();

    window.location.href = googleAuthUrl;
  };

  const handleFacebookLogin = () => {
    setAuthError(null);
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    if (!appId) {
      setAuthError('NEXT_PUBLIC_FACEBOOK_APP_ID is not configured in .env.local.');
      return;
    }

    setLoadingProvider('facebook');
    const redirectUri = `${window.location.origin}/auth/callback/facebook`;

    const fbAuthUrl =
      'https://www.facebook.com/v18.0/dialog/oauth?' +
      new URLSearchParams({
        client_id: appId,
        redirect_uri: redirectUri,
        scope: 'email,public_profile',
        response_type: 'code',
      }).toString();

    window.location.href = fbAuthUrl;
  };

  return (
    <div className="space-y-3">
      {authError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200 text-center">
          {authError}
        </div>
      )}

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-50 dark:bg-slate-950 px-3 text-[11px] font-semibold text-slate-400 tracking-wider">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loadingProvider !== null}
          className="flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm active:scale-[0.98] disabled:opacity-60"
        >
          {loadingProvider === 'google' ? (
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
          ) : (
            <GoogleIcon className="h-4 w-4 shrink-0" />
          )}
          <span>Google</span>
        </button>

        <button
          type="button"
          onClick={handleFacebookLogin}
          disabled={loadingProvider !== null}
          className="flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm active:scale-[0.98] disabled:opacity-60"
        >
          {loadingProvider === 'facebook' ? (
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
          ) : (
            <FacebookIcon className="h-4 w-4 shrink-0" />
          )}
          <span>Facebook</span>
        </button>
      </div>
    </div>
  );
}
