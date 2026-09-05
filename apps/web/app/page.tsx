'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Compass,
  ArrowRight,
  Sparkles,
  Calendar,
  DollarSign,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronDown,
  Check,
  Play,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/shared/navbar';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, getCurrencySymbol } from '@/lib/utils';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  // Interactive Live Demo State
  const [activeDemoTab, setActiveDemoTab] = React.useState<'itinerary' | 'expenses' | 'vault' | 'tasks'>('itinerary');
  
  // Interactive Split Simulator state with INR default
  const [demoCurrency, setDemoCurrency] = React.useState<string>('INR');
  const [demoExpenseAmount, setDemoExpenseAmount] = React.useState<number>(4000);

  // Interactive Tasks state
  const [demoTasks, setDemoTasks] = React.useState([
    { id: '1', title: 'Book Sunset Catamaran cruise', assignee: 'Alex M.', done: true, due: 'Day 2' },
    { id: '2', title: 'Reserve table at Osteria del Mare', assignee: 'Maya K.', done: true, due: 'Day 1' },
    { id: '3', title: 'Arrange airport transfer shuttle', assignee: 'Liam T.', done: false, due: 'Day 1' },
    { id: '4', title: 'Confirm villa check-in code', assignee: 'Elena R.', done: false, due: 'Day 1' },
  ]);

  // Interactive FAQ state
  const [openFaq, setOpenFaq] = React.useState<number | null>(0);

  const toggleTask = (id: string) => {
    setDemoTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const completedTasksCount = demoTasks.filter(t => t.done).length;

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 trip-bg-mesh flex flex-col selection:bg-indigo-500/20 selection:text-indigo-900 dark:selection:text-indigo-200">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 lg:pb-32">
        {/* Glow ambient background element */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[850px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-blue-600/15 via-indigo-600/15 to-violet-600/15 blur-3xl dark:from-blue-500/20 dark:via-indigo-500/20 dark:to-purple-500/20" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/90 px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-glass-sm backdrop-blur-md dark:border-indigo-900/60 dark:bg-indigo-950/60 dark:text-indigo-300 animate-pulse-subtle">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span>TripOS 2.0 • The Next-Gen Group Travel Operating System</span>
          </div>

          {/* Main Headline */}
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-[1.08]">
            Turn chaotic group trips into{' '}
            <span className="trip-gradient-text">effortless memories.</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-600 dark:text-slate-300 sm:text-xl leading-relaxed">
            Replace scattered WhatsApp chats, lost receipts, and messy spreadsheets.
            One unified workspace for collaborative itineraries, zero-anxiety expense splits, and secure travel documents.
          </p>

          {/* Hero CTA Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <button className="group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-8 py-4 text-base font-bold text-white shadow-[0_10px_25px_-5px_rgba(79,70,229,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_15px_30px_-5px_rgba(79,70,229,0.55)] active:scale-[0.98]">
                  <span>Open Your Workspace</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 transition-transform duration-200 group-hover:translate-x-1">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              </Link>
            ) : (
              <>
                <Link href="/auth/register">
                  <button className="group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-8 py-4 text-base font-bold text-white shadow-[0_10px_25px_-5px_rgba(79,70,229,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_15px_30px_-5px_rgba(79,70,229,0.55)] active:scale-[0.98]">
                    <span>Start Planning Free</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 transition-transform duration-200 group-hover:translate-x-1">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </button>
                </Link>
                <a href="#demo">
                  <button className="inline-flex items-center gap-2.5 rounded-full border border-slate-300/80 bg-white/80 px-7 py-4 text-base font-semibold text-slate-800 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-white hover:shadow-md active:scale-[0.98] dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:border-slate-600">
                    <Play className="h-4 w-4 text-indigo-600 dark:text-indigo-400 fill-indigo-600/20" />
                    <span>Try Interactive Demo</span>
                  </button>
                </a>
              </>
            )}
          </div>

          {/* Trust proof stats with glassmorphic pill */}
          <div className="mt-14 max-w-4xl mx-auto rounded-3xl border border-slate-200/60 bg-white/60 p-6 shadow-glass-sm backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/50">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">100%</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Auditable Settlements</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">0 Math</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Disputes & Anxiety</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Multi-Currency</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">USD, EUR, GBP, INR</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Offline Ready</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Vault & Vouchers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE WORKSPACE DEMO SHOWCASE */}
      <section id="demo" className="py-16 sm:py-24 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <Badge variant="default" className="mb-3">Interactive Workspace Preview</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Experience TripOS in action right now
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Switch between tabs below to test live itinerary planning, real-time split simulations, document vault previews, and interactive task commitments.
            </p>
          </div>

          {/* Interactive Showcase Frame */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 overflow-hidden">
            {/* Top Workspace Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                  🏝️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white">Amalfi Coast Adventure</h3>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                      Active Trip
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Positano & Capri • Sep 12 → Sep 19 • 4 Members
                  </p>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800/80">
                <button
                  onClick={() => setActiveDemoTab('itinerary')}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                    activeDemoTab === 'itinerary'
                      ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Itinerary
                </button>
                <button
                  onClick={() => setActiveDemoTab('expenses')}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                    activeDemoTab === 'expenses'
                      ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <span className="font-bold text-xs">{getCurrencySymbol(demoCurrency)}</span>
                  Split & Settle
                </button>
                <button
                  onClick={() => setActiveDemoTab('vault')}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                    activeDemoTab === 'vault'
                      ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Vault
                </button>
                <button
                  onClick={() => setActiveDemoTab('tasks')}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                    activeDemoTab === 'tasks'
                      ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Tasks ({completedTasksCount}/{demoTasks.length})
                </button>
              </div>
            </div>

            {/* Showcase Tab Contents */}
            <div className="p-6 sm:p-8 min-h-[420px] flex flex-col justify-center">
              {/* TAB 1: ITINERARY PREVIEW */}
              {activeDemoTab === 'itinerary' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">Day 1: Arrival & Cliffside Dinner</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Wednesday, Sep 12 • Positano, Italy</p>
                    </div>
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full">
                      3 Activities Scheduled
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-950/50">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                          <Clock className="h-3.5 w-3.5" /> 14:00
                        </span>
                        <Badge variant="secondary">Check-in</Badge>
                      </div>
                      <h5 className="font-semibold text-slate-900 dark:text-white text-sm">Villa Treville Positano</h5>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" /> Via Laurito 2, Positano
                      </p>
                    </div>

                    <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-4 transition shadow-sm dark:border-indigo-900/60 dark:bg-indigo-950/30">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                          <Clock className="h-3.5 w-3.5" /> 17:30
                        </span>
                        <Badge variant="accent">Highlight</Badge>
                      </div>
                      <h5 className="font-semibold text-slate-900 dark:text-white text-sm">Sunset Limoncello Tasting</h5>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" /> Piazza dei Mulini
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-950/50">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                          <Clock className="h-3.5 w-3.5" /> 20:00
                        </span>
                        <Badge variant="secondary">Dining</Badge>
                      </div>
                      <h5 className="font-semibold text-slate-900 dark:text-white text-sm">Dinner at Ristorante Max</h5>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" /> Reservation under Alex
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-center dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      💡 Everyone on the trip gets instant real-time sync when activities are added or adjusted.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: EXPENSES & SPLIT SIMULATOR */}
              {activeDemoTab === 'expenses' && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Trip Total Spend</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(demoExpenseAmount * 100 * 3, demoCurrency)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">4 participants</p>
                    </div>

                    <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Your Balance</p>
                      <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(demoExpenseAmount * 100 * 0.75, demoCurrency)}
                      </p>
                      <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">You are owed money</p>
                    </div>

                    <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/30">
                      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Smart Settlement</p>
                      <p className="mt-1 text-sm font-bold text-indigo-900 dark:text-indigo-200">
                        Maya pays Alex {formatCurrency((demoExpenseAmount / 4) * 100, demoCurrency)}
                      </p>
                      <p className="mt-0.5 text-xs text-indigo-600 dark:text-indigo-400">1 payment settles all debts</p>
                    </div>
                  </div>

                  {/* Interactive Split Simulator Control */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h5 className="font-semibold text-slate-900 dark:text-white text-sm">Interactive Split Simulator</h5>
                        <p className="text-xs text-slate-500">Adjust the amount or currency to see instantaneous fair division and debt reduction:</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Expense:</span>
                        <div className="relative flex items-center">
                          <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-2.5 text-xs font-bold text-slate-400">
                            {getCurrencySymbol(demoCurrency)}
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={demoExpenseAmount}
                            onChange={(e) => setDemoExpenseAmount(Number(e.target.value) || 0)}
                            className="w-28 rounded-lg border border-slate-200 pl-6 pr-2 py-1 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-right"
                          />
                        </div>

                        {/* Currency Selector */}
                        <select
                          value={demoCurrency}
                          onChange={(e) => setDemoCurrency(e.target.value)}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                        >
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="AED">AED (د.إ)</option>
                          <option value="SGD">SGD (S$)</option>
                          <option value="CAD">CAD (C$)</option>
                          <option value="AUD">AUD (A$)</option>
                          <option value="JPY">JPY (¥)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-4 text-center">
                      {['Alex (Payer)', 'Maya', 'Liam', 'Elena'].map((member) => (
                        <div key={member} className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{member}</p>
                          <p className="mt-1 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                            {formatCurrency((demoExpenseAmount / 4) * 100, demoCurrency)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: VAULT PREVIEW */}
              {activeDemoTab === 'vault' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">Trip Vault & Travel Files</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Secure encrypted storage for bookings, boarding passes, and vouchers</p>
                    </div>
                    <Badge variant="success">All Files Synced</Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50 flex items-start justify-between">
                      <div>
                        <span className="text-xl">✈️</span>
                        <h5 className="font-semibold text-slate-900 dark:text-white text-sm mt-1">Flight_AF1492_E-Ticket.pdf</h5>
                        <p className="text-xs text-slate-500">2.4 MB • Air France</p>
                      </div>
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">PDF</span>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50 flex items-start justify-between">
                      <div>
                        <span className="text-xl">🏡</span>
                        <h5 className="font-semibold text-slate-900 dark:text-white text-sm mt-1">Villa_Treville_Booking.pdf</h5>
                        <p className="text-xs text-slate-500">1.1 MB • Confirmation #7819</p>
                      </div>
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">PDF</span>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50 flex items-start justify-between">
                      <div>
                        <span className="text-xl">🛥️</span>
                        <h5 className="font-semibold text-slate-900 dark:text-white text-sm mt-1">Capri_Ferry_Passes.png</h5>
                        <p className="text-xs text-slate-500">840 KB • QR Boarding Voucher</p>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">IMAGE</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: TASKS PREVIEW */}
              {activeDemoTab === 'tasks' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">Collaborative Task Board</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Click tasks below to interactively mark them completed:
                      </p>
                    </div>
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Progress: <span className="text-indigo-600 dark:text-indigo-400">{Math.round((completedTasksCount / demoTasks.length) * 100)}%</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
                      style={{ width: `${(completedTasksCount / demoTasks.length) * 100}%` }}
                    />
                  </div>

                  <div className="space-y-2">
                    {demoTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className={`flex items-center justify-between rounded-xl border p-3.5 cursor-pointer transition ${
                          task.done
                            ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-950 dark:bg-emerald-950/20 text-slate-500'
                            : 'border-slate-200 bg-slate-50/70 hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                              task.done
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {task.done && <Check className="h-3.5 w-3.5" />}
                          </div>
                          <span className={`text-sm font-medium ${task.done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
                            {task.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {task.assignee}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">{task.due}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section id="features" className="py-20 sm:py-28 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="default" className="mb-3">Engineered for Travel Harmony</Badge>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Everything your group needs. In one place.
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300 text-base sm:text-lg">
              Designed from the ground up for modern group travel, eliminating repetitive questions and financial friction.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1 */}
            <div className="trip-glass-card rounded-3xl p-7 relative group hover:-translate-y-1.5 transition duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-300 mb-5 shadow-inner">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Visual Itinerary</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Day-by-day interactive timeline with locations, start/end times, map links, and attendee headcount.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="trip-glass-card rounded-3xl p-7 relative group hover:-translate-y-1.5 transition duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-300 mb-5 shadow-inner">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Smart Split & Settle</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Record expenses in multiple currencies. Automatic debt graph simplification so you settle with minimal transactions.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="trip-glass-card rounded-3xl p-7 relative group hover:-translate-y-1.5 transition duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/70 dark:text-purple-300 mb-5 shadow-inner">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Encrypted Vault</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Centralized storage for flight tickets, Airbnb confirmations, and passports. Accessible by the entire group anytime.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="trip-glass-card rounded-3xl p-7 relative group hover:-translate-y-1.5 transition duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-300 mb-5 shadow-inner">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Role-Based Access</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Trip owners, editors, and members. 1-click email and copyable invitation links for seamless group onboarding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE: OLD WAY VS TRIPOS WAY */}
      <section className="py-20 sm:py-28 relative">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Why groups switch to TripOS
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm sm:text-base">
              The difference between spending your holiday arguing over math and enjoying every moment together.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xl overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 text-center font-bold text-sm sm:text-base">
              <div className="p-4 bg-red-50/40 text-red-700 dark:bg-red-950/20 dark:text-red-400">
                ❌ Traditional Group Travel Chaos
              </div>
              <div className="p-4 bg-emerald-50/40 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                ✨ The TripOS Standard
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
              {[
                ['Scattered WhatsApp messages, screenshots, and pinned notes', 'Single unified real-time dashboard for the entire trip'],
                ['"Who owes what?" arguments after the trip ends', 'Deterministic math with automated debt-simplification settlement'],
                ['Lost PDF tickets and panic at the boarding gate', 'Offline-friendly centralized vault for all group travel documents'],
                ['One person gets stuck doing all the planning', 'Collaborative delegation with task owners and due dates'],
                ['Clunky spreadsheets broken on mobile screens', 'Mobile-first fluid responsive design designed for on-the-go thumb use'],
              ].map(([oldWay, newWay], i) => (
                <div key={i} className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800/80 p-4 items-center">
                  <div className="text-slate-600 dark:text-slate-400 pr-3">{oldWay}</div>
                  <div className="text-slate-900 dark:text-slate-100 font-semibold pl-3 flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{newWay}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (3 STEPS) */}
      <section id="how-it-works" className="py-20 sm:py-28 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="default" className="mb-3">Simple 3-Step Journey</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              From idea to touchdown in minutes
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3 relative">
            <div className="trip-glass-card rounded-3xl p-8 relative">
              <span className="text-5xl font-black text-indigo-600/15 dark:text-indigo-400/15 absolute top-6 right-6">01</span>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold text-lg mb-6 shadow-md shadow-indigo-600/25">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create & Invite</h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Create a trip workspace in 10 seconds. Share your private invite link with your friends via WhatsApp or email.
              </p>
            </div>

            <div className="trip-glass-card rounded-3xl p-8 relative">
              <span className="text-5xl font-black text-indigo-600/15 dark:text-indigo-400/15 absolute top-6 right-6">02</span>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold text-lg mb-6 shadow-md shadow-indigo-600/25">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Coordinate & Plan</h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Add activities, assign bookings to members, and store boarding passes & villa vouchers in the shared vault.
              </p>
            </div>

            <div className="trip-glass-card rounded-3xl p-8 relative">
              <span className="text-5xl font-black text-indigo-600/15 dark:text-indigo-400/15 absolute top-6 right-6">03</span>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold text-lg mb-6 shadow-md shadow-indigo-600/25">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Spend & Settle</h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Log expenses on the go. TripOS automatically computes net balances and generates the fastest path to zero.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 sm:py-28 relative">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="default" className="mb-3">Got Questions?</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'How does the TripOS expense split algorithm work?',
                a: 'TripOS tracks each expense along with who paid and who participated. When it is time to settle, our debt simplification algorithm computes the minimal number of transactions required to resolve all IOUs completely, eliminating messy circular debts.'
              },
              {
                q: 'Can members add activities and files without an account initially?',
                a: 'Anyone invited can sign up in 15 seconds to gain full collaborative access. Trip owners can invite members via email or share a private link.'
              },
              {
                q: 'Does TripOS support international currencies?',
                a: 'Yes! TripOS supports multiple currencies including USD, EUR, GBP, and INR, ensuring international trips and cross-border travel are easy to manage.'
              },
              {
                q: 'Is TripOS mobile-friendly?',
                a: 'TripOS is built mobile-first. You get a fluid, lightning-fast experience on iPhones, Androids, tablets, and desktops.'
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="trip-glass-card rounded-2xl overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-semibold text-slate-900 dark:text-white text-sm sm:text-base"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
                      openFaq === idx ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL HIGH-CONVERSION CTA BANNER */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 sm:p-14 text-center text-white shadow-2xl overflow-hidden">
            {/* Ambient pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_70%)] pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Ready to plan your best group trip yet?
              </h2>
              <p className="text-indigo-100 text-sm sm:text-lg">
                Join thousands of friends, families, and travel squads traveling stress-free with TripOS.
              </p>
              <div className="pt-2">
                <Link href={isAuthenticated ? '/dashboard' : '/auth/register'}>
                  <button className="rounded-full bg-white px-9 py-4 text-base font-bold text-indigo-700 shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-50 hover:shadow-2xl active:scale-[0.98]">
                    {isAuthenticated ? 'Go to Dashboard' : 'Get Started for Free'}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/60 bg-white/70 py-12 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/70 mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm">
                <Compass className="h-4 w-4" />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">TripOS</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} TripOS. The Group Travel Operating System. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <Link href="/auth/login" className="hover:text-indigo-600 transition">Sign In</Link>
              <Link href="/auth/register" className="hover:text-indigo-600 transition">Register</Link>
              <a href="#features" className="hover:text-indigo-600 transition">Features</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
