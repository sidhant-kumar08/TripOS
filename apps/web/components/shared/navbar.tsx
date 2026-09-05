'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Compass, LogOut, LayoutDashboard, Menu, X, ArrowRight, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isLanding = pathname === '/';

  return (
    <div className="sticky top-3 z-50 mx-auto w-full max-w-6xl px-4 sm:px-6">
      <header className="rounded-full border border-white/60 dark:border-white/10 bg-white/45 dark:bg-slate-950/45 px-4 py-2.5 shadow-[0_8px_32px_0_rgba(31,38,135,0.09)] backdrop-blur-2xl backdrop-saturate-150 transition-all">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link href={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5 group pl-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20 transition-all duration-300 group-hover:scale-105 group-hover:rotate-6">
              <Compass className="h-5 w-5" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                TripOS
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded-md hidden sm:inline-block">
                Beta
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 rounded-full bg-slate-900/5 dark:bg-white/5 p-1 border border-slate-900/5 dark:border-white/10">
            {isLanding ? (
              <>
                <a
                  href="#features"
                  className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all"
                >
                  Features
                </a>
                <a
                  href="#demo"
                  className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all"
                >
                  Live Demo
                </a>
                <a
                  href="#how-it-works"
                  className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all"
                >
                  How It Works
                </a>
                <a
                  href="#faq"
                  className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all"
                >
                  FAQ
                </a>
              </>
            ) : isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    pathname === '/dashboard'
                      ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    pathname === '/profile'
                      ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <UserIcon className="h-3.5 w-3.5" />
                  Profile
                </Link>
              </>
            ) : null}
          </nav>

          {/* Right Action Controls */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-1">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-full py-1 px-1.5 pr-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition group"
                  title="View Profile Settings"
                >
                  <div className="h-8 w-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-gradient-to-tr from-indigo-500 to-purple-600 text-xs font-bold text-white shadow-sm flex items-center justify-center shrink-0">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user?.name || 'User'} className="h-full w-full object-cover" />
                    ) : (
                      getInitials(user?.name || user?.email || 'User')
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 max-w-[120px] truncate">
                    {user?.name || user?.email?.split('@')[0]}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50/60 dark:text-slate-300 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition"
                  title="Log out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/auth/login"
                  className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/35 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="mt-3 rounded-2xl border border-white/40 dark:border-white/10 bg-white/85 p-4 backdrop-blur-2xl dark:bg-slate-950/90 shadow-2xl md:hidden space-y-3">
            {isLanding ? (
              <div className="flex flex-col space-y-2">
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  Features
                </a>
                <a
                  href="#demo"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  Live Demo
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  How It Works
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  FAQ
                </a>
              </div>
            ) : isAuthenticated ? (
              <div className="flex flex-col space-y-2">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900 flex items-center gap-2"
                >
                  <LayoutDashboard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900 flex items-center gap-2"
                >
                  <UserIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Profile Settings
                </Link>
              </div>
            ) : null}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              {isAuthenticated ? (
                <div className="flex items-center justify-between">
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden bg-indigo-600 text-xs font-bold text-white">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user?.name || 'User'} className="h-full w-full object-cover" />
                      ) : (
                        getInitials(user?.name || user?.email || 'User')
                      )}
                    </div>
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      {user?.name || user?.email}
                    </span>
                  </Link>
                  <Button onClick={handleLogout} variant="ghost" size="sm">
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full rounded-full border border-slate-200 py-2.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:text-white">
                      Sign In
                    </button>
                  </Link>
                  <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full rounded-full bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md">
                      Get Started Free
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
