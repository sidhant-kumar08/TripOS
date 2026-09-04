'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ProtectedRoute } from '@/lib/protected-route';
import { tripsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { PageShell } from '@/components/ui/page-shell';
import { Card } from '@/components/ui/controls';

interface Trip {
  id: string;
  name: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  members: any[];
}

export default function TripDetailPage() {
  return (
    <ProtectedRoute>
      <TripDetail />
    </ProtectedRoute>
  );
}

function TripDetail() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const tripId = params.tripId as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);

  useEffect(() => {
    loadTrip();
  }, [tripId]);

  const loadTrip = async () => {
    try {
      const response = await tripsApi.getById(tripId);
      setTrip(response.data);
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
      await tripsApi.invite(tripId, inviteEmail);
      setInviteMessage(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setTimeout(() => setInviteMessage(''), 3000);
    } catch (error: any) {
      setInviteMessage(
        error.response?.data?.message || 'Failed to send invitation'
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading trip...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Trip not found</p>
      </div>
    );
  }

  const isOwner = trip.members.some(
    (m) => m.userId === user?.id && m.role === 'OWNER'
  );

  return (
    <PageShell title={trip.name} subtitle={trip.destination ? `📍 ${trip.destination}` : 'Trip workspace overview'} backHref="/dashboard" backLabel="Back to dashboard">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-8">
          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Trip Details</h2>
            <dl className="mt-4 space-y-5 text-sm">
              {trip.description && (
                <div>
                  <dt className="font-medium text-slate-900">Description</dt>
                  <dd className="mt-1 text-slate-600">{trip.description}</dd>
                </div>
              )}
              {trip.startDate && (
                <div>
                  <dt className="font-medium text-slate-900">Dates</dt>
                  <dd className="mt-1 text-slate-600">
                    {new Date(trip.startDate).toLocaleDateString()}
                    {trip.endDate && ` → ${new Date(trip.endDate).toLocaleDateString()}`}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['🗺️ Itinerary', 'Build activities and assign tasks.', `/trips/${tripId}/itinerary`],
              ['💸 Expenses', 'Track splits and settlement.', `/trips/${tripId}/expenses`],
              ['📁 Vault', 'Store trip files securely.', `/trips/${tripId}/vault`],
            ].map(([title, desc, href]) => (
              <Link key={title} href={href} className="trip-card trip-card-hover block">
                <p className="text-lg font-semibold text-slate-900">{title}</p>
                <p className="mt-2 text-sm text-slate-600">{desc}</p>
                <p className="mt-5 text-sm font-semibold text-blue-600">Open →</p>
              </Link>
            ))}
          </div>
        </div>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Members</h2>
            {isOwner && (
              <button onClick={() => setShowInviteForm(!showInviteForm)} className="trip-button-secondary px-3 py-2 text-xs">
                + Invite
              </button>
            )}
          </div>

          {showInviteForm && (
            <form onSubmit={handleInvite} className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <input type="email" placeholder="Email address" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="trip-input" />
              {inviteMessage && <p className="text-xs font-medium text-emerald-600">{inviteMessage}</p>}
              <div className="flex gap-3">
                <button type="submit" className="trip-button flex-1 py-2.5 text-xs">Send</button>
                <button type="button" onClick={() => setShowInviteForm(false)} className="trip-button-secondary flex-1 py-2.5 text-xs">Cancel</button>
              </div>
            </form>
          )}

          <ul className="mt-5 space-y-3">
            {trip.members.map((member) => (
              <li key={member.userId} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{member.user.name}</p>
                  <p className="text-xs text-slate-500">{member.user.email}</p>
                </div>
                <span className="trip-badge bg-slate-100 text-slate-700">{member.role}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </PageShell>
  );
}
