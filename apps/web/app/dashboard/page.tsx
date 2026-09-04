'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/lib/protected-route';
import { tripsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui/controls';
import { PageShell } from '@/components/ui/page-shell';

interface Trip {
  id: string;
  name: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}

function Dashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewTripForm, setShowNewTripForm] = useState(false);
  const [tripName, setTripName] = useState('');
  const [destination, setDestination] = useState('');

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const response = await tripsApi.list();
      setTrips(response.data);
    } catch (error) {
      console.error('Failed to load trips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripName.trim()) return;

    try {
      const response = await tripsApi.create({
        name: tripName,
        destination: destination || undefined,
      });
      setTrips([response.data, ...trips]);
      setTripName('');
      setDestination('');
      setShowNewTripForm(false);
    } catch (error) {
      console.error('Failed to create trip:', error);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <PageShell
      title="Dashboard"
      subtitle={`Welcome back, ${user?.name ?? 'traveler'}. Manage your trips and plans from here.`}
      actions={
        <button onClick={handleLogout} className="trip-button-secondary px-4 py-2">
          Logout
        </button>
      }
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Your workspace</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">My Trips</h2>
        </div>
        <button onClick={() => setShowNewTripForm(!showNewTripForm)} className="trip-button">
          + New Trip
        </button>
      </div>

      {showNewTripForm && (
        <Card className="mb-8">
          <h3 className="text-lg font-semibold text-slate-900">Create a new trip</h3>
          <form onSubmit={handleCreateTrip} className="mt-5 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Trip name *</label>
                <input type="text" required className="trip-input" placeholder="e.g., Bali 2026" value={tripName} onChange={(e) => setTripName(e.target.value)} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Destination</label>
                <input type="text" className="trip-input" placeholder="e.g., Bali, Indonesia" value={destination} onChange={(e) => setDestination(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="trip-button">Create Trip</button>
              <button type="button" onClick={() => setShowNewTripForm(false)} className="trip-button-secondary">Cancel</button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="trip-card text-center text-slate-600">Loading trips...</div>
      ) : trips.length === 0 ? (
        <Card className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600">✈️</div>
          <p className="mt-4 text-lg font-semibold text-slate-900">You haven't created any trips yet</p>
          <p className="mt-2 text-sm text-slate-500">Start by creating your first trip workspace.</p>
          <button onClick={() => setShowNewTripForm(true)} className="trip-button mt-6">Create your first trip</button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {trips.map((trip) => (
            <Link key={trip.id} href={`/trips/${trip.id}`} className="trip-card trip-card-hover block">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{trip.name}</h3>
                  {trip.destination && <p className="mt-2 text-sm text-slate-600">📍 {trip.destination}</p>}
                </div>
                <span className="trip-badge bg-blue-50 text-blue-700">Open</span>
              </div>
              {trip.startDate && (
                <p className="mt-5 text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
                  {new Date(trip.startDate).toLocaleDateString()}
                  {trip.endDate && ` → ${new Date(trip.endDate).toLocaleDateString()}`}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
