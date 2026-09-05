'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  Calendar,
  DollarSign,
  FileText,
  ArrowRight,
  UserPlus,
  Copy,
  Check,
  Mail,
  Trash2,
  Clock,
  Send,
  MapPin,
  CheckCircle2,
  Circle,
  ListTodo,
  Receipt,
  Shield,
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/runtime-config';
import { ProtectedRoute } from '@/lib/protected-route';
import { tripsApi, expensesApi } from '@/lib/api';
import { PageShell } from '@/components/ui/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { StatCard } from '@/components/shared/stat-card';
import { formatDate, formatDateTime, formatCurrency, getInitials, getCurrencySymbol } from '@/lib/utils';

interface TripMember {
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'EDITOR';
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface PendingSentInvite {
  id: string;
  email: string;
  token: string;
  createdAt: string;
  expiresAt: string;
}

interface TripActivity {
  id: string;
  title: string;
  location?: string;
  startTime: string;
  endTime: string;
}

interface TripTask {
  id: string;
  title: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  assignedTo?: string;
  dueDate?: string;
}

interface TripExpense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  payer?: { name?: string; email?: string };
  addedBy?: { name?: string; email?: string; id?: string };
  payerId?: string;
  createdAt: string;
}

interface Trip {
  id: string;
  name: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  members: TripMember[];
}

export default function TripDetailPage() {
  return (
    <ProtectedRoute>
      <TripDetailContent />
    </ProtectedRoute>
  );
}

function TripDetailContent() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.tripId as string;

  const [trip, setTrip] = React.useState<Trip | null>(null);
  const [activities, setActivities] = React.useState<TripActivity[]>([]);
  const [tasks, setTasks] = React.useState<TripTask[]>([]);
  const [expenses, setExpenses] = React.useState<TripExpense[]>([]);
  const [vaultFileCount, setVaultFileCount] = React.useState<number>(0);
  const [sentInvitations, setSentInvitations] = React.useState<PendingSentInvite[]>([]);
  const [revokingId, setRevokingId] = React.useState<string | null>(null);
  const [copiedToken, setCopiedToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteStatus, setInviteStatus] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isInviting, setIsInviting] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [generatedInviteUrl, setGeneratedInviteUrl] = React.useState<string | null>(null);

  const getAuthHeader = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return { Authorization: `Bearer ${token}` };
  };

  React.useEffect(() => {
    loadTripOverview();
  }, [tripId]);

  const loadTripOverview = async () => {
    try {
      setIsLoading(true);
      const config = { headers: getAuthHeader() };

      const [tripRes, sentRes, activitiesRes, tasksRes, expensesRes, vaultRes] = await Promise.all([
        tripsApi.getById(tripId),
        tripsApi.getTripPendingInvitations(tripId).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/trips/${tripId}/activities`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/trips/${tripId}/tasks`, config).catch(() => ({ data: [] })),
        expensesApi.list(tripId).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/trips/${tripId}/vault/files`, config).catch(() => ({ data: [] })),
      ]);

      setTrip(tripRes.data);
      setSentInvitations(sentRes.data || []);
      setActivities(activitiesRes.data || []);
      setTasks(tasksRes.data || []);
      setExpenses(expensesRes.data || []);
      setVaultFileCount((vaultRes.data || []).length);
    } catch (error) {
      console.error('Failed to load trip overview:', error);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTaskStatus = async (task: TripTask) => {
    const newStatus = task.status === 'COMPLETED' ? 'OPEN' : 'COMPLETED';
    try {
      const config = { headers: getAuthHeader() };
      await axios.put(
        `${API_BASE_URL}/trips/${tripId}/tasks/${task.id}`,
        { status: newStatus },
        config
      );
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error('Failed to update task status:', err);
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
      loadTripOverview();
    } catch (error: any) {
      setInviteStatus({
        type: 'error',
        message: error.response?.data?.message || 'Failed to send invitation',
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      setRevokingId(invitationId);
      await tripsApi.revokeInvitation(tripId, invitationId);
      setSentInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to revoke invitation');
    } finally {
      setRevokingId(null);
    }
  };

  const copySpecificToken = (token: string) => {
    if (typeof window !== 'undefined') {
      const inviteUrl = `${window.location.origin}/invite/${token}`;
      navigator.clipboard.writeText(inviteUrl);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    }
  };

  const copyGeneratedLink = () => {
    if (generatedInviteUrl && typeof window !== 'undefined') {
      navigator.clipboard.writeText(generatedInviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const openInviteModal = () => {
    setIsInviteModalOpen(true);
    setInviteStatus(null);
    setGeneratedInviteUrl(null);
  };

  if (isLoading) {
    return (
      <PageShell
        title="Loading trip workspace..."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Trip Overview' }]}
      >
        <div className="trip-glass-card rounded-2xl p-12 text-center animate-pulse">
          <p className="text-sm text-slate-500">Loading trip details and workspace overview...</p>
        </div>
      </PageShell>
    );
  }

  if (!trip) {
    return (
      <PageShell
        title="Trip not found"
        backHref="/dashboard"
        backLabel="Return to Dashboard"
      >
        <div className="trip-glass-card rounded-2xl p-8 text-center">
          <p className="text-slate-600 dark:text-slate-400">The requested trip workspace could not be found.</p>
        </div>
      </PageShell>
    );
  }

  // Calculate summary metrics
  const totalSpend = expenses
    .filter((e: any) => e.category !== 'SETTLEMENT')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const primaryCurrency = expenses.length > 0 ? (expenses[0].currency || 'INR') : 'INR';

  const completedTasksCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const taskProgressPercent = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  // Next upcoming activity
  const now = new Date();
  const upcomingActivities = activities
    .slice()
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const nextActivity = upcomingActivities.find((a) => new Date(a.endTime) >= now) || upcomingActivities[0];

  // Trip Countdown / Status
  let tripStatusBadge = 'Active Workspace';
  let tripCountdownText = '';
  if (trip.startDate) {
    const start = new Date(trip.startDate);
    const end = trip.endDate ? new Date(trip.endDate) : null;
    const diffDays = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      tripCountdownText = `Starts in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
      tripStatusBadge = `Upcoming (${diffDays}d)`;
    } else if (end && now > end) {
      tripCountdownText = 'Trip Completed';
      tripStatusBadge = 'Completed Journey';
    } else {
      tripCountdownText = 'In Progress Now';
      tripStatusBadge = 'Live Journey';
    }
  }

  return (
    <PageShell
      title={trip.name}
      subtitle={trip.destination ? `📍 ${trip.destination}` : 'Collaborative trip workspace'}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: trip.name },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button onClick={openInviteModal} variant="default" size="sm" className="shadow-glow-primary">
            <UserPlus className="h-4 w-4 mr-1.5" />
            Invite Member
          </Button>
        </div>
      }
    >
      {/* Enhanced Trip Hero Banner */}
      <div className="mb-8 trip-glass-card rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-900/20 via-blue-900/10 to-purple-900/20 border-indigo-200/60 dark:border-indigo-900/50 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent" className="font-bold">
                {tripStatusBadge}
              </Badge>
              {trip.startDate && (
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-200/60 dark:border-indigo-900/40 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(trip.startDate)} {trip.endDate ? `→ ${formatDate(trip.endDate)}` : ''}
                </span>
              )}
              {tripCountdownText && (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  • {tripCountdownText}
                </span>
              )}
            </div>
            {trip.description && (
              <p className="text-sm text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed">
                {trip.description}
              </p>
            )}
          </div>

          {/* Members Stack Preview */}
          <div className="flex items-center gap-3 shrink-0 bg-white/70 dark:bg-slate-900/70 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex -space-x-2 overflow-hidden">
              {trip.members?.map((m) => (
                <div
                  key={m.userId}
                  title={`${m.user.name} (${m.role})`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-xs font-bold text-white ring-2 ring-white dark:ring-slate-900 shadow-sm"
                >
                  {getInitials(m.user.name || m.user.email)}
                </div>
              ))}
            </div>
            <div className="pr-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">
                {trip.members?.length} {trip.members?.length === 1 ? 'Traveler' : 'Travelers'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                In Workspace
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Key Summary Glance Metrics */}
      <div className="mb-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Trip Spend"
          value={formatCurrency(totalSpend, primaryCurrency)}
          subtext={`${expenses.length} transaction${expenses.length === 1 ? '' : 's'} recorded`}
          icon={<span className="font-bold text-sm">{getCurrencySymbol(primaryCurrency)}</span>}
          variant="indigo"
        />

        <StatCard
          label="Next Activity"
          value={nextActivity ? nextActivity.title : 'No upcoming plans'}
          subtext={nextActivity ? formatDateTime(nextActivity.startTime) : 'Schedule plans in itinerary'}
          icon={<Calendar className="h-4 w-4" />}
          variant="default"
        />

        <StatCard
          label="Tasks Completed"
          value={`${completedTasksCount} / ${tasks.length}`}
          subtext={`${taskProgressPercent}% completion rate`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          variant={tasks.length > 0 && completedTasksCount === tasks.length ? 'success' : 'default'}
        />

        <StatCard
          label="Trip Documents"
          value={`${vaultFileCount} Files`}
          subtext="Tickets, reservations & vouchers"
          icon={<FileText className="h-4 w-4" />}
          variant="indigo"
        />
      </div>

      {/* 3 Main Workspace Feature Gateways */}
      <div className="mb-8 grid gap-6 md:grid-cols-3">
        {/* Itinerary Gateway */}
        <Link
          href={`/trips/${tripId}/itinerary`}
          className="group trip-glass-card rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/60 hover:shadow-xl flex flex-col justify-between"
        >
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 mb-4 shadow-inner">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
              Itinerary & Tasks
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Schedule activities, pin locations, time slots, and assign group tasks.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <span>View Timeline ({activities.length})</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        {/* Expenses Gateway */}
        <Link
          href={`/trips/${tripId}/expenses`}
          className="group trip-glass-card rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/60 hover:shadow-xl flex flex-col justify-between"
        >
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 mb-4 shadow-inner">
              <DollarSign className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
              Expenses & Splits
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Track shared purchases, split costs fairly, and calculate minimal settlement debts.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span>Open Ledger ({expenses.length})</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        {/* Vault Gateway */}
        <Link
          href={`/trips/${tripId}/vault`}
          className="group trip-glass-card rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-purple-400/60 hover:shadow-xl flex flex-col justify-between"
        >
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300 mb-4 shadow-inner">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
              Trip Vault
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Secure repository for flight boarding passes, Airbnb vouchers, and IDs.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-purple-600 dark:text-purple-400">
            <span>Access Vault ({vaultFileCount})</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
          </div>
        </Link>
      </div>

      {/* 2-Column Overview Widgets Grid */}
      <div className="mb-8 grid gap-8 lg:grid-cols-2">
        {/* Left Column: Itinerary Preview & Recent Spends */}
        <div className="space-y-6">
          {/* Upcoming Schedule Preview */}
          <div className="trip-glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Upcoming Itinerary
                </h3>
              </div>
              <Link
                href={`/trips/${tripId}/itinerary`}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
              >
                <span>Full Timeline</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {activities.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 space-y-2">
                <p>No activities scheduled yet.</p>
                <Link href={`/trips/${tripId}/itinerary`}>
                  <Button variant="outline" size="sm" className="mt-1 text-xs">
                    + Add First Activity
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingActivities.slice(0, 3).map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-xl border border-slate-200/70 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                          {act.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                          {act.location && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3 text-indigo-500" /> {act.location} •
                            </span>
                          )}
                          <span>{formatDateTime(act.startTime)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Spends Preview */}
          <div className="trip-glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Recent Spends
                </h3>
              </div>
              <Link
                href={`/trips/${tripId}/expenses`}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
              >
                <span>View Ledger</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {expenses.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 space-y-2">
                <p>No expenses recorded yet.</p>
                <Link href={`/trips/${tripId}/expenses`}>
                  <Button variant="outline" size="sm" className="mt-1 text-xs">
                    + Add First Expense
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {expenses.slice(0, 3).map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3 rounded-xl border border-slate-200/70 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {exp.description}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Paid by {exp.payer?.name || 'Member'} • {formatDate(exp.createdAt)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {formatCurrency(exp.amount, exp.currency || 'INR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Tasks & Members */}
        <div className="space-y-6">
          {/* Active Tasks Checklist Preview */}
          <div className="trip-glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Active Tasks Checklist
                </h3>
              </div>
              <Link
                href={`/trips/${tripId}/itinerary`}
                className="text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1"
              >
                <span>All Tasks</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {tasks.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 space-y-2">
                <p>No tasks assigned yet.</p>
                <Link href={`/trips/${tripId}/itinerary`}>
                  <Button variant="outline" size="sm" className="mt-1 text-xs">
                    + Add First Task
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl border border-slate-200/70 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleToggleTaskStatus(task)}
                        className="text-slate-400 hover:text-emerald-600 transition shrink-0"
                      >
                        {task.status === 'COMPLETED' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                        )}
                      </button>
                      <span
                        className={`text-xs font-semibold ${
                          task.status === 'COMPLETED'
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    <Badge
                      variant={
                        task.status === 'COMPLETED'
                          ? 'success'
                          : task.status === 'IN_PROGRESS'
                          ? 'warning'
                          : 'secondary'
                      }
                      className="text-[10px]"
                    >
                      {task.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Members & Invitations Section */}
          <div className="trip-glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Collaborators & Access
                </h3>
              </div>
              <Button onClick={openInviteModal} size="sm" variant="outline" className="text-xs h-7">
                <UserPlus className="h-3.5 w-3.5 mr-1" />
                Invite
              </Button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {trip.members?.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/70 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 font-bold text-white text-xs shrink-0">
                      {getInitials(member.user.name || member.user.email)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                        {member.user.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {member.user.email}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={member.role === 'OWNER' ? 'accent' : 'secondary'}
                    className="text-[10px]"
                  >
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Pending Sent Invitations */}
            {sentInvitations.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Pending Invitations ({sentInvitations.length})
                </p>
                {sentInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs"
                  >
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[140px] text-[11px]">
                      {inv.email}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => copySpecificToken(inv.token)}
                        className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition"
                      >
                        {copiedToken === inv.token ? 'Copied' : 'Copy Link'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRevokeInvitation(inv.id)}
                        disabled={revokingId === inv.id}
                        className="p-1 text-slate-400 hover:text-red-600 transition disabled:opacity-50"
                        title="Revoke"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* INVITE MEMBER MODAL */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setInviteStatus(null);
          setGeneratedInviteUrl(null);
        }}
        title="Invite Friend to Trip"
        description="Send an invitation link or email for this workspace."
        maxWidth="lg"
      >
        <div className="space-y-5 mt-2">
          {inviteStatus && (
            <div
              className={`rounded-xl border p-3 text-xs ${
                inviteStatus.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-200'
                  : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200'
              }`}
            >
              {inviteStatus.message}
            </div>
          )}

          {generatedInviteUrl && (
            <div className="space-y-3 p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60">
              <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                Share this direct invite link with your friend:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedInviteUrl}
                  className="flex-1 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-mono text-slate-800 dark:border-indigo-800 dark:bg-slate-900 dark:text-slate-200"
                />
                <Button onClick={copyGeneratedLink} size="sm" variant="default">
                  {copiedLink ? <Check className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4" />}
                  {copiedLink ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                They can open this link to preview and accept the trip invite.
              </p>
            </div>
          )}

          <form onSubmit={handleInvite} className="space-y-4">
            <Input
              type="email"
              label="Friend's Email Address *"
              placeholder="friend@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              icon={<Mail className="h-4 w-4" />}
              required
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setInviteStatus(null);
                  setGeneratedInviteUrl(null);
                }}
              >
                Close
              </Button>
              <Button
                type="submit"
                variant="default"
                isLoading={isInviting}
              >
                <Send className="h-4 w-4 mr-1.5" />
                Generate & Send Invite
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </PageShell>
  );
}

