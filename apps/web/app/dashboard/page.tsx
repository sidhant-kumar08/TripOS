'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  Plus,
  Calendar,
  MapPin,
  Users,
  Search,
  ArrowRight,
  Sparkles,
  Plane,
  Mail,
  Check,
  X,
} from 'lucide-react';
import { ProtectedRoute } from '@/lib/protected-route';
import { tripsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { PageShell } from '@/components/ui/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { StatCard } from '@/components/shared/stat-card';
import { EmptyState } from '@/components/shared/empty-state';
import { formatDate } from '@/lib/utils';

interface Trip {
  id: string;
  name: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  members?: any[];
}

interface PendingInvite {
  id: string;
  token: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  tripId: string;
  tripName: string;
  destination?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  membersCount: number;
  inviterName: string;
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [pendingInvitations, setPendingInvitations] = React.useState<PendingInvite[]>([]);
  const [actingInviteToken, setActingInviteToken] = React.useState<string | null>(null);
  const [inviteNotification, setInviteNotification] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterTab, setFilterTab] = React.useState<'all' | 'upcoming' | 'past'>('all');

  // New trip modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [tripName, setTripName] = React.useState('');
  const [destination, setDestination] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [tripsRes, invitesRes] = await Promise.all([
        tripsApi.list().catch(() => ({ data: [] })),
        tripsApi.getMyPendingInvitations().catch(() => ({ data: [] })),
      ]);
      setTrips(tripsRes.data || []);
      setPendingInvitations(invitesRes.data || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvite = async (token: string, tripId: string) => {
    try {
      setActingInviteToken(token);
      await tripsApi.acceptInvitation(token);
      setInviteNotification('Invitation accepted! Opening trip workspace...');
      setTimeout(() => {
        router.push(`/trips/${tripId}`);
      }, 800);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to accept invitation');
      setActingInviteToken(null);
    }
  };

  const handleDeclineInvite = async (token: string) => {
    try {
      setActingInviteToken(token);
      await tripsApi.declineInvitation(token);
      setPendingInvitations(prev => prev.filter(inv => inv.token !== token));
      setInviteNotification('Invitation declined.');
      setTimeout(() => setInviteNotification(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to decline invitation');
    } finally {
      setActingInviteToken(null);
    }
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripName.trim()) return;

    if (!startDate || !endDate) {
      setErrorMessage('Please select both a start date and an end date');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (startDate < todayStr) {
      setErrorMessage('Start date cannot be in the past');
      return;
    }

    if (startDate > endDate) {
      setErrorMessage('End date cannot be earlier than start date');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      const response = await tripsApi.create({
        name: tripName.trim(),
        destination: destination.trim() || undefined,
        description: description.trim() || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });

      setTrips(prev => [response.data, ...prev]);
      setIsCreateModalOpen(false);
      resetForm();
      router.push(`/trips/${response.data.id}`);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to create trip');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTripName('');
    setDestination('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setErrorMessage('');
  };

  // Filtered trips
  const filteredTrips = trips.filter(trip => {
    const matchesSearch =
      trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (trip.destination && trip.destination.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === 'upcoming') {
      if (!trip.endDate) return true;
      return new Date(trip.endDate) >= new Date();
    }
    if (filterTab === 'past') {
      if (!trip.endDate) return false;
      return new Date(trip.endDate) < new Date();
    }
    return true;
  });

  return (
    <PageShell
      title={`Hello, ${user?.name?.split(' ')[0] || 'Traveler'} 👋`}
      subtitle="Manage your shared itineraries, group balances, and trip workspaces."
      actions={
        <Button onClick={() => setIsCreateModalOpen(true)} size="default" className="shadow-md shadow-indigo-600/20">
          <Plus className="h-4 w-4 mr-1" />
          Create Trip
        </Button>
      }
    >
      {/* Pending Invitations Banner if any */}
      {inviteNotification && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 animate-in fade-in">
          {inviteNotification}
        </div>
      )}

      {pendingInvitations.length > 0 && (
        <div className="mb-8 rounded-3xl border border-indigo-200/80 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-violet-50/80 p-6 shadow-sm dark:border-indigo-900/60 dark:bg-gradient-to-r dark:from-indigo-950/40 dark:via-blue-950/30 dark:to-slate-900/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Pending Trip Invitations ({pendingInvitations.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You have been invited to collaborate on these trip workspaces.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="trip-glass-card rounded-2xl p-5 flex flex-col justify-between gap-4 border-indigo-200/60 dark:border-indigo-800/60 shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {inv.tripName}
                    </h4>
                    <Badge variant="accent">
                      <Users className="h-3 w-3 mr-1" />
                      {inv.membersCount} {inv.membersCount === 1 ? 'member' : 'members'}
                    </Badge>
                  </div>

                  {inv.destination && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      <MapPin className="h-3.5 w-3.5" />
                      {inv.destination}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                    Invited by <strong className="text-slate-900 dark:text-white">{inv.inviterName}</strong>
                  </p>

                  {inv.startDate && (
                    <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(inv.startDate)} {inv.endDate ? `→ ${formatDate(inv.endDate)}` : ''}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    onClick={() => handleAcceptInvite(inv.token, inv.tripId)}
                    variant="default"
                    size="sm"
                    className="flex-1"
                    isLoading={actingInviteToken === inv.token}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept & Join
                  </Button>
                  <Button
                    onClick={() => handleDeclineInvite(inv.token)}
                    variant="ghost"
                    size="sm"
                    className="text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    disabled={actingInviteToken === inv.token}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Stat Metrics */}
      <div className="mb-8 grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Trips"
          value={trips.length}
          subtext="Workspaces joined or created"
          icon={<Plane className="h-4 w-4" />}
          variant="indigo"
        />
        <StatCard
          label="Active Groups"
          value={trips.length}
          subtext="Coordinating in real-time"
          icon={<Users className="h-4 w-4" />}
          variant="default"
        />
        <StatCard
          label="Settlement Engine"
          value="100% Active"
          subtext="Auditable debt simplification"
          icon={<Sparkles className="h-4 w-4" />}
          variant="success"
        />
        <StatCard
          label="Trip Vault"
          value="Encrypted"
          subtext="Passports, vouchers & tickets"
          icon={<Compass className="h-4 w-4" />}
          variant="default"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Tabs */}
        <div className="flex overflow-x-auto scrollbar-none rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800/80 w-full sm:w-fit gap-1">
          <button
            onClick={() => setFilterTab('all')}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
              filterTab === 'all'
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            All Trips ({trips.length})
          </button>
          <button
            onClick={() => setFilterTab('upcoming')}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
              filterTab === 'upcoming'
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilterTab('past')}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
              filterTab === 'past'
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Past Trips
          </button>
        </div>

        {/* Search Bar */}
        <div className="w-full sm:w-72">
          <Input
            type="text"
            placeholder="Search trips or destinations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Trips Grid or Empty State */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="trip-glass-card rounded-2xl p-6 animate-pulse space-y-4">
              <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-16 rounded-xl bg-slate-200/60 dark:bg-slate-800/60" />
            </div>
          ))}
        </div>
      ) : filteredTrips.length === 0 ? (
        <EmptyState
          icon={<Plane className="h-8 w-8" />}
          title={searchQuery ? 'No matching trips found' : "You haven't created any trips yet"}
          description={
            searchQuery
              ? 'Try changing your search keywords or filter tab.'
              : 'TripOS keeps your itinerary, group expenses, and travel documents synchronized in one place.'
          }
          actionLabel={searchQuery ? 'Clear Search' : '+ Create Your First Trip'}
          onAction={searchQuery ? () => setSearchQuery('') : () => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTrips.map((trip) => (
            <Link
              key={trip.id}
              href={`/trips/${trip.id}`}
              className="group trip-glass-card rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/50 hover:shadow-xl flex flex-col justify-between"
            >
              <div>
                {/* Header tag & Status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-base dark:bg-indigo-950/60">
                      🧭
                    </span>
                    <Badge variant="default">Workspace</Badge>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition duration-200 flex items-center gap-1">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>

                {/* Trip Title & Destination */}
                <h3 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400 transition">
                  {trip.name}
                </h3>

                {trip.destination && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                    <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span>{trip.destination}</span>
                  </p>
                )}

                {trip.description && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {trip.description}
                  </p>
                )}
              </div>

              {/* Footer info: Dates and Quick Pills */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {trip.startDate ? formatDate(trip.startDate) : 'Flexible Dates'}
                </span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {trip.members?.length || 1} {trip.members?.length === 1 ? 'member' : 'members'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* CREATE TRIP MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create a New Trip"
        description="Set up a workspace for your group to coordinate itinerary, expenses, and files."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTrip} className="space-y-4 mt-2">
          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200">
              {errorMessage}
            </div>
          )}

          <Input
            label="Trip Name *"
            placeholder="e.g. Kyoto Cherry Blossom Trip 🌸"
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            required
          />

          <Input
            label="Destination"
            placeholder="e.g. Kyoto, Japan"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            icon={<MapPin className="h-4 w-4 text-slate-400" />}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              type="date"
              label="Start Date *"
              value={startDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              type="date"
              label="End Date *"
              value={endDate}
              min={startDate || new Date().toISOString().split('T')[0]}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <Textarea
            label="Trip Description / Notes (Optional)"
            placeholder="e.g. Annual group getaway with friends from college. Focus on food, hiking, and relaxation."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              isLoading={isSubmitting}
            >
              Create Trip Workspace
            </Button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
