'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Compass,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { tripsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/shared/navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

interface InvitationDetails {
  id: string;
  email?: string;
  tripId: string;
  tripName: string;
  destination?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  membersCount: number;
  isExpired: boolean;
  isUsed: boolean;
}

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [invitation, setInvitation] = React.useState<InvitationDetails | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAccepting, setIsAccepting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    if (token) {
      loadInvitation();
    }
  }, [token]);

  const loadInvitation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await tripsApi.getInvitation(token);
      setInvitation(res.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'This invitation link is invalid or has expired.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/invite/${token}`);
      return;
    }

    try {
      setIsAccepting(true);
      setError(null);
      await tripsApi.acceptInvitation(token);
      setSuccess(true);
      setTimeout(() => {
        router.push(`/trips/${invitation?.tripId || ''}`);
      }, 1200);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to accept invitation. Please try again.'
      );
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="min-h-screen trip-bg-mesh flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg">
          {isLoading || authLoading ? (
            <div className="trip-glass-card rounded-3xl p-10 text-center animate-pulse space-y-4">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                <Compass className="h-7 w-7 text-indigo-500 animate-spin" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Fetching invitation details...
              </p>
            </div>
          ) : error && !invitation ? (
            <div className="trip-glass-card rounded-3xl p-8 sm:p-10 text-center space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Invitation Not Available
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {error}
                </p>
              </div>
              <div className="pt-2">
                <Link href="/dashboard">
                  <Button variant="default" className="w-full">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          ) : invitation ? (
            <div className="trip-glass-card rounded-3xl p-8 sm:p-10 shadow-2xl border-indigo-200/50 dark:border-indigo-900/50 space-y-6 animate-in fade-in zoom-in-95 duration-300">
              {/* Header Badge */}
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3.5 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  Trip Workspace Invitation
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  You&apos;re Invited to Join
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Collaborate on itineraries, split expenses, and share booking files.
                </p>
              </div>

              {/* Trip Preview Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/60 p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {invitation.tripName}
                    </h2>
                    {invitation.destination && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                        <MapPin className="h-3.5 w-3.5" />
                        {invitation.destination}
                      </p>
                    )}
                  </div>
                  <Badge variant="accent">
                    <Users className="h-3 w-3 mr-1" />
                    {invitation.membersCount} {invitation.membersCount === 1 ? 'member' : 'members'}
                  </Badge>
                </div>

                {invitation.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                    {invitation.description}
                  </p>
                )}

                {invitation.startDate && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      {formatDate(invitation.startDate)}{' '}
                      {invitation.endDate ? `→ ${formatDate(invitation.endDate)}` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Status Alert if error */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success celebration */}
              {success && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Invitation accepted! Redirecting you to trip workspace...</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                {invitation.isExpired ? (
                  <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                    This invitation has expired. Ask the trip owner to send a new invite link.
                  </div>
                ) : invitation.isUsed ? (
                  <div className="space-y-2">
                    <div className="text-center p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium">
                      This invitation has already been used.
                    </div>
                    <Link href={`/trips/${invitation.tripId}`}>
                      <Button variant="default" className="w-full">
                        Go to Trip Workspace
                      </Button>
                    </Link>
                  </div>
                ) : isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1 text-xs text-slate-500">
                      <span>Logged in as</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {user?.email}
                      </span>
                    </div>
                    <Button
                      onClick={handleAccept}
                      variant="default"
                      size="lg"
                      className="w-full shadow-glow-primary"
                      isLoading={isAccepting}
                      disabled={success}
                    >
                      <ShieldCheck className="h-4 w-4 mr-1.5" />
                      Accept & Join Workspace
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <Link href={`/auth/login?redirect=/invite/${token}`}>
                      <Button variant="default" size="lg" className="w-full shadow-glow-primary">
                        Sign In to Accept Invitation
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                    <Link href={`/auth/register?redirect=/invite/${token}`}>
                      <Button variant="outline" size="lg" className="w-full">
                        Create New Account First
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
