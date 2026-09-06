'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Calendar,
  DollarSign,
  FileText,
  ArrowRight,
  UserPlus,
  Copy,
  Check,
  Clock,
  Send,
  MapPin,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Circle,
  ListTodo,
  Receipt,
  Sparkles,
  ExternalLink,
  CheckSquare,
} from 'lucide-react';
import { ProtectedRoute } from '@/lib/protected-route';
import { commandCenterApi, tripsApi, tasksApi } from '@/lib/api';
import { PageShell } from '@/components/ui/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatDate, formatCurrency, getInitials } from '@/lib/utils';

export default function TripDetailPage() {
  return (
    <ProtectedRoute>
      <TripCommandCenterContent />
    </ProtectedRoute>
  );
}

function TripCommandCenterContent() {
  const params = useParams();
  const tripId = params.tripId as string;

  const [overview, setOverview] = React.useState<any | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showReadinessDetails, setShowReadinessDetails] = React.useState(false);

  // Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteStatus, setInviteStatus] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isInviting, setIsInviting] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [generatedInviteUrl, setGeneratedInviteUrl] = React.useState<string | null>(null);

  // Task Action Feedback
  const [completingTaskId, setCompletingTaskId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (tripId) {
      loadCommandCenter();
    }
  }, [tripId]);

  const loadCommandCenter = async () => {
    try {
      setIsLoading(true);
      const res = await commandCenterApi.getOverview(tripId);
      setOverview(res.data);
    } catch (error) {
      console.error('Failed to load Trip Command Center:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickCompleteTask = async (taskId: string) => {
    try {
      setCompletingTaskId(taskId);
      await tasksApi.update(tripId, taskId, { status: 'COMPLETED' });
      // Reload overview to update state & readiness
      await loadCommandCenter();
    } catch (error) {
      console.error('Failed to complete task:', error);
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setIsInviting(true);
      setInviteStatus(null);
      const res = await tripsApi.invite(tripId, inviteEmail.trim());
      const inviteUrl = `${window.location.origin}/invite/${res.data.token}`;
      setGeneratedInviteUrl(inviteUrl);
      setInviteStatus({
        type: 'success',
        message: `Invitation generated for ${inviteEmail}!`,
      });
      loadCommandCenter();
    } catch (error: any) {
      setInviteStatus({
        type: 'error',
        message: error.response?.data?.message || 'Failed to send invitation',
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyInviteLink = () => {
    if (!generatedInviteUrl) return;
    navigator.clipboard.writeText(generatedInviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (isLoading) {
    return (
      <PageShell title="Loading Command Center...">
        <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
          {/* Header Skeleton */}
          <div className="h-28 rounded-3xl bg-slate-200 dark:bg-slate-800/60" />
          {/* Navigation Bar Skeleton */}
          <div className="h-12 rounded-2xl bg-slate-200 dark:bg-slate-800/40" />
          {/* Readiness Card Skeleton */}
          <div className="h-36 rounded-3xl bg-slate-200 dark:bg-slate-800/60" />
          {/* Content Grid Skeleton */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800/50" />
            <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800/50" />
          </div>
        </div>
      </PageShell>
    );
  }

  if (!overview?.trip) {
    return (
      <PageShell title="Trip Not Found">
        <div className="text-center py-16">
          <p className="text-slate-500 mb-4">This trip does not exist or you do not have permission to view it.</p>
          <Link href="/dashboard">
            <Button variant="default">Return to Dashboard</Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  const { trip, readiness, myAttention, waitingOnOthers, nextUp, financialSnapshot, progress } = overview;

  return (
    <PageShell
      title={trip.name}
      subtitle={trip.destination ? `📍 ${trip.destination}` : 'Group Trip Command Center'}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: trip.name },
      ]}
      actions={
        <Button variant="default" onClick={() => setIsInviteModalOpen(true)} className="gap-2 shadow-sm">
          <UserPlus className="h-4 w-4" />
          <span>Invite Squad</span>
        </Button>
      }
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* ================= 1. TRIP HEADER & CONTEXT BAR ================= */}
        <div className="relative overflow-hidden rounded-3xl border border-indigo-100/80 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 p-5 sm:p-7 text-white shadow-xl">
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white">
                  {trip.name}
                </h1>
                {progress.daysAwayLabel && (
                  <span className="rounded-full bg-indigo-500/30 border border-indigo-400/40 px-2.5 py-0.5 text-xs font-bold text-indigo-200 backdrop-blur">
                    {progress.daysAwayLabel}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-indigo-200/90">
                {trip.destination && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                    {trip.destination}
                  </span>
                )}
                {trip.startDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                    {formatDate(trip.startDate)}
                    {trip.endDate && ` – ${formatDate(trip.endDate)}`}
                  </span>
                )}
              </div>
            </div>

            {/* Active Squad Avatars */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/15">
              <div className="flex -space-x-2">
                {trip.members.slice(0, 4).map((m: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-[10px] font-bold text-white ring-2 ring-slate-900 shadow-sm"
                    title={m.user.name || m.user.email}
                  >
                    {getInitials(m.user.name || m.user.email)}
                  </div>
                ))}
              </div>
              <span className="text-xs font-semibold text-indigo-100">
                {trip.members.length} {trip.members.length === 1 ? 'Traveler' : 'Travelers'}
              </span>
            </div>
          </div>
        </div>

        {/* ================= 2. MODULE NAVIGATION JUMP BAR ================= */}
        <div className="flex items-center overflow-x-auto scrollbar-none gap-2 p-1.5 rounded-2xl border border-slate-200/80 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
          <button
            className="flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-2 text-xs sm:text-sm font-bold shadow-sm shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            <span>Command Center</span>
          </button>

          <Link href={`/trips/${tripId}/itinerary`}>
            <button className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/80 transition shrink-0">
              <Calendar className="h-4 w-4 text-indigo-500" />
              <span>Itinerary</span>
              {progress.activitiesCount > 0 && (
                <span className="rounded-full bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] font-bold">
                  {progress.activitiesCount}
                </span>
              )}
            </button>
          </Link>

          <Link href={`/trips/${tripId}/expenses`}>
            <button className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/80 transition shrink-0">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <span>Expenses</span>
              {financialSnapshot.totalSpend > 0 && (
                <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.2 text-[10px] font-bold">
                  {formatCurrency(financialSnapshot.totalSpend, financialSnapshot.currency)}
                </span>
              )}
            </button>
          </Link>

          <Link href={`/trips/${tripId}/tasks`}>
            <button className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/80 transition shrink-0">
              <ListTodo className="h-4 w-4 text-purple-500" />
              <span>Tasks</span>
              {progress.tasksTotal > 0 && (
                <span className="rounded-full bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] font-bold">
                  {progress.tasksCompleted}/{progress.tasksTotal}
                </span>
              )}
            </button>
          </Link>

          <Link href={`/trips/${tripId}/vault`}>
            <button className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/80 transition shrink-0">
              <FileText className="h-4 w-4 text-blue-500" />
              <span>Vault</span>
              {progress.vaultFilesCount > 0 && (
                <span className="rounded-full bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] font-bold">
                  {progress.vaultFilesCount}
                </span>
              )}
            </button>
          </Link>
        </div>

        {/* ================= 3. TRIP READINESS CARD ================= */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 p-5 sm:p-6 shadow-sm backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Visual Score Ring */}
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-50 to-indigo-100 dark:from-indigo-950/60 dark:to-indigo-900/40 border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                  {readiness.score}%
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">
                    Trip Readiness
                  </h2>
                  <Badge
                    variant={
                      readiness.status === 'READY'
                        ? 'success'
                        : readiness.status === 'NEEDS_ATTENTION'
                        ? 'warning'
                        : 'accent'
                    }
                  >
                    {readiness.status === 'READY'
                      ? 'Ready to Go 🛫'
                      : readiness.status === 'NEEDS_ATTENTION'
                      ? 'Action Needed'
                      : 'In Planning'}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {readiness.summaryText}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReadinessDetails(!showReadinessDetails)}
              className="gap-1.5 self-start sm:self-auto text-xs"
            >
              <span>{showReadinessDetails ? 'Hide Breakdown' : 'Explain Score'}</span>
              {showReadinessDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </div>

          {/* Expandable Breakdown Checklist */}
          {showReadinessDetails && (
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
              {readiness.checks.map((chk: any) => (
                <div
                  key={chk.id}
                  className="flex items-start gap-2.5 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-950/40"
                >
                  <div className="mt-0.5 shrink-0">
                    {chk.status === 'COMPLETE' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : chk.status === 'IN_PROGRESS' ? (
                      <Clock className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{chk.label}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{chk.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= 4. PRIORITY 1: MY ATTENTION ================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-indigo-500" />
              <span>What Needs My Attention</span>
            </h3>
            {myAttention.length > 0 && (
              <span className="rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 text-xs font-bold">
                {myAttention.length} Action{myAttention.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {myAttention.length === 0 ? (
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 dark:border-emerald-950/60 dark:bg-emerald-950/20 p-5 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300 shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">You're all caught up! ✨</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">No overdue tasks or urgent obligations waiting on you.</p>
                </div>
              </div>
              <Link href={`/trips/${tripId}/itinerary`} className="mt-3 sm:mt-0 block">
                <Button variant="outline" size="sm" className="text-xs gap-1">
                  <span>View Timeline</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {myAttention.map((item: any) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 mt-0.5 ${
                        item.urgency === 'HIGH'
                          ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300'
                          : item.urgency === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}
                    >
                      {item.urgency === 'HIGH' ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : item.sourceType === 'EXPENSE' ? (
                        <DollarSign className="h-4 w-4" />
                      ) : (
                        <CheckSquare className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h4>
                        <span
                          className={`rounded-full px-2 py-0.2 text-[10px] font-bold uppercase tracking-wider ${
                            item.urgency === 'HIGH'
                              ? 'bg-red-50 text-red-700 dark:bg-red-950/80 dark:text-red-300'
                              : item.urgency === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {item.urgency === 'HIGH' ? 'Overdue' : item.urgency === 'MEDIUM' ? 'Due Soon' : 'Action'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {item.sourceType === 'TASK' && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={completingTaskId === item.sourceId}
                        onClick={() => handleQuickCompleteTask(item.sourceId)}
                        className="text-xs gap-1 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:hover:bg-emerald-950 dark:hover:text-emerald-300"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Done</span>
                      </Button>
                    )}

                    <Link href={item.actionUrl}>
                      <Button variant="default" size="sm" className="text-xs gap-1">
                        <span>{item.actionLabel}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= 5. WAITING ON OTHERS & NEXT UP (GRID) ================= */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Waiting on Others */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-purple-500" />
                <span>Waiting on Others</span>
              </h3>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 p-4 shadow-sm space-y-3">
              {waitingOnOthers.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  No pending bottlenecks or items waiting on other members.
                </p>
              ) : (
                waitingOnOthers.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.title}</p>
                      <p className="text-[11px] text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-0.5">
                        <span className="font-semibold">{item.assigneeName}</span>
                        {item.dueDate && <span>• Due {formatDate(item.dueDate)}</span>}
                      </p>
                    </div>

                    <Link href={item.actionUrl} className="shrink-0">
                      <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-slate-500 hover:text-slate-900">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Next Up */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span>Next Up on Schedule</span>
              </h3>
              <Link href={`/trips/${tripId}/itinerary`} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Full Itinerary →
              </Link>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 p-4 shadow-sm space-y-3">
              {nextUp.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-500 mb-2">No timeline events scheduled yet.</p>
                  <Link href={`/trips/${tripId}/itinerary`}>
                    <Button variant="outline" size="sm" className="text-xs">Add First Activity</Button>
                  </Link>
                </div>
              ) : (
                nextUp.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.title}</p>
                        {item.dayLabel && (
                          <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[9px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300 shrink-0">
                            {item.dayLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.date && `${item.date} `}
                        {item.time && `• ${item.time} `}
                        {item.location && `• 📍 ${item.location}`}
                      </p>
                    </div>

                    <Link href={item.actionUrl} className="shrink-0">
                      <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-slate-500 hover:text-slate-900">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ================= 6. FINANCIAL SNAPSHOT CARD ================= */}
        <div className="rounded-3xl border border-emerald-100/80 bg-white/90 dark:border-emerald-950/60 dark:bg-slate-900/90 p-5 sm:p-6 shadow-sm backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                <Receipt className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                    Financial Snapshot
                  </h3>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 text-xs font-bold">
                    {formatCurrency(financialSnapshot.totalSpend, financialSnapshot.currency)} Total
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                  {financialSnapshot.myObligationSummary}
                </p>
              </div>
            </div>

            <Link href={`/trips/${tripId}/expenses`} className="self-start sm:self-auto">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <span>View Expense Ledger</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ================= INVITE SQUAD MODAL ================= */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setInviteStatus(null);
          setGeneratedInviteUrl(null);
        }}
        title="Invite Travelers to Squad"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Invite friends to collaborate on this trip. They will be able to add activities, log expenses, and upload documents.
          </p>

          <form onSubmit={handleInvite} className="space-y-3">
            <Input
              label="Email Address"
              type="email"
              placeholder="friend@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
            <Button variant="default" type="submit" className="w-full gap-2" disabled={isInviting}>
              <Send className="h-4 w-4" />
              <span>{isInviting ? 'Generating...' : 'Send Invitation Link'}</span>
            </Button>
          </form>

          {inviteStatus && (
            <div
              className={`p-3 rounded-xl text-xs font-medium ${
                inviteStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300'
              }`}
            >
              {inviteStatus.message}
            </div>
          )}

          {generatedInviteUrl && (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Shareable Invite URL:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedInviteUrl}
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono select-all"
                />
                <Button variant="outline" size="sm" onClick={handleCopyInviteLink} className="gap-1 text-xs shrink-0">
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </PageShell>
  );
}
