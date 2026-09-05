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
} from 'lucide-react';
import { ProtectedRoute } from '@/lib/protected-route';
import { tripsApi } from '@/lib/api';
import { PageShell } from '@/components/ui/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatDate, getInitials } from '@/lib/utils';

interface TripMember {
  userId: string;
  role: 'OWNER' | 'EDITOR' | 'MEMBER';
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface PendingSentInvite {
  id: string;
  email: string;
  token: string;
  createdAt: string;
  expiresAt: string;
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

  React.useEffect(() => {
    loadTrip();
  }, [tripId]);

  const loadTrip = async () => {
    try {
      setIsLoading(true);
      const [tripRes, sentRes] = await Promise.all([
        tripsApi.getById(tripId),
        tripsApi.getTripPendingInvitations(tripId).catch(() => ({ data: [] })),
      ]);
      setTrip(tripRes.data);
      setSentInvitations(sentRes.data || []);
    } catch (error) {
      console.error('Failed to load trip:', error);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
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
      loadTrip();
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
      setSentInvitations(prev => prev.filter(inv => inv.id !== invitationId));
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
          <p className="text-sm text-slate-500">Loading trip details and itinerary...</p>
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
          <Button onClick={openInviteModal} variant="default" size="sm">
            <UserPlus className="h-4 w-4 mr-1" />
            Invite Member
          </Button>
        </div>
      }
    >
      {/* Trip Quick Info Banner */}
      <div className="mb-8 trip-glass-card rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-violet-600/10 border-indigo-200/60 dark:border-indigo-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent">Active Workspace</Badge>
              {trip.startDate && (
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  📅 {formatDate(trip.startDate)} {trip.endDate ? `→ ${formatDate(trip.endDate)}` : ''}
                </span>
              )}
            </div>
            {trip.description && (
              <p className="text-sm text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed">
                {trip.description}
              </p>
            )}
          </div>

          {/* Members Stack preview */}
          <div className="flex items-center gap-3">
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
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {trip.members?.length} {trip.members?.length === 1 ? 'member' : 'members'}
            </span>
          </div>
        </div>
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
            <span>View Timeline</span>
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
            <span>Open Ledger</span>
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
            <span>Access Files</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
          </div>
        </Link>
      </div>

      {/* Members Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Group Members & Invitations</CardTitle>
              <CardDescription>Collaborators with access to this trip workspace</CardDescription>
            </div>
            <Button onClick={openInviteModal} size="sm">
              <UserPlus className="h-4 w-4 mr-1" />
              Invite Member
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Active Members */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Active Members ({trip.members?.length || 0})
            </h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {trip.members?.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 font-bold text-white text-xs">
                      {getInitials(member.user.name || member.user.email)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                        {member.user.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {member.user.email}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={member.role === 'OWNER' ? 'accent' : 'secondary'}
                  >
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Sent Invitations */}
          {sentInvitations.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Pending Invitations ({sentInvitations.length})
              </h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sentInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-amber-200/70 bg-amber-50/40 p-3.5 dark:border-amber-900/50 dark:bg-amber-950/20"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                          <Mail className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                            {inv.email}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            Sent {formatDate(inv.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="warning">Pending</Badge>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-amber-100 dark:border-amber-900/30">
                      <Button
                        onClick={() => copySpecificToken(inv.token)}
                        variant="secondary"
                        size="sm"
                        className="flex-1 text-[11px] h-7"
                      >
                        {copiedToken === inv.token ? (
                          <Check className="h-3 w-3 text-emerald-500 mr-1" />
                        ) : (
                          <Copy className="h-3 w-3 mr-1" />
                        )}
                        {copiedToken === inv.token ? 'Link Copied' : 'Copy Link'}
                      </Button>
                      <Button
                        onClick={() => handleRevokeInvitation(inv.id)}
                        variant="ghost"
                        size="sm"
                        className="text-[11px] h-7 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                        isLoading={revokingId === inv.id}
                        title="Revoke Invitation"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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

          {/* Modal Pending Sent List */}
          {sentInvitations.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active Pending Invitations ({sentInvitations.length})
              </h5>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {sentInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">{inv.email}</span>
                      <span className="text-[10px] text-slate-500 ml-2">Sent {formatDate(inv.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => copySpecificToken(inv.token)}
                        className="px-2 py-1 rounded-lg bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition"
                      >
                        {copiedToken === inv.token ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRevokeInvitation(inv.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        title="Revoke"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </PageShell>
  );
}
