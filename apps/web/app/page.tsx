'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
  type Variants,
} from 'framer-motion';
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
  ShieldCheck,
  Star,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/shared/navbar';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, getCurrencySymbol } from '@/lib/utils';

// Stagger animation container variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemFadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// Showcase Trip Preview for 3D Hero Card
const SHOWCASE_TRIP = {
  name: 'Amalfi Coast & Capri Adventure 🏝️',
  location: 'Positano, Italy',
  currency: 'EUR',
  totalSpend: 145000,
  members: ['Alex', 'Maya', 'Liam', 'Elena'],
  nextActivity: 'Sunset Limoncello Tasting 🍋',
  nextTime: '17:30 • Piazza dei Mulini',
  vaultDoc: 'Villa_Treville_Voucher.pdf',
  task: 'Confirm Capri Ferry passes',
  badge: 'Live Squad Trip',
};

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  // Interactive Live Demo State
  const [activeDemoTab, setActiveDemoTab] = React.useState<'itinerary' | 'expenses' | 'vault' | 'tasks'>('itinerary');
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
    setDemoTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const completedTasksCount = demoTasks.filter((t) => t.done).length;

  // 3D Card Tilt on Mouse Move
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothMouseX = useSpring(mouseX, { damping: 25, stiffness: 120 });
  const smoothMouseY = useSpring(mouseY, { damping: 25, stiffness: 120 });

  const rotateX = useTransform(smoothMouseY, [-180, 180], [6, -6]);
  const rotateY = useTransform(smoothMouseX, [-180, 180], [-6, 6]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 trip-bg-mesh flex flex-col overflow-x-hidden">
      <Navbar />

      {/* ================= HERO SECTION ================= */}
      <section className="relative overflow-hidden pt-8 pb-10 sm:pt-14 sm:pb-14">
        {/* Floating Glowing Animated Background Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            x: [0, 25, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -top-32 left-1/4 h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, -30, 0],
            y: [0, 25, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="pointer-events-none absolute -top-16 right-1/4 h-[380px] w-[380px] rounded-full bg-gradient-to-bl from-purple-600/15 via-pink-600/15 to-violet-600/15 blur-3xl"
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center max-w-4xl mx-auto"
          >
            {/* Eyebrow Pill */}
            <motion.div variants={itemFadeUp} className="inline-flex items-center justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/90 px-4 py-1.5 text-xs sm:text-sm font-semibold text-indigo-700 shadow-glass-sm backdrop-blur-md dark:border-indigo-900/60 dark:bg-indigo-950/60 dark:text-indigo-300">
                <Sparkles className="h-4 w-4 text-indigo-500 animate-pulse" />
                <span>TripOS • The Modern Group Travel Operating System</span>
              </div>
            </motion.div>

            {/* Main Catchy Headline (Balanced 2 Rows) */}
            <motion.h1
              variants={itemFadeUp}
              className="mt-6 font-display text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold tracking-tight leading-[1.15] text-slate-900 dark:text-white max-w-3xl mx-auto"
            >
              Turn chaotic group trips into{' '}
              <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                effortless memories.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemFadeUp}
              className="mt-6 max-w-2xl mx-auto text-base sm:text-xl text-slate-600 dark:text-slate-300 font-normal leading-relaxed"
            >
              Say goodbye to scattered WhatsApp threads, forgotten IOUs, and lost vouchers.
              One collaborative workspace for shared itineraries, fair expense splitting, and encrypted booking vaults.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemFadeUp}
              className="mt-8 flex flex-wrap items-center justify-center gap-3.5"
            >
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <motion.button
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-7 py-3.5 text-sm sm:text-base font-bold text-white shadow-[0_10px_25px_-5px_rgba(79,70,229,0.45)] hover:shadow-[0_15px_30px_-5px_rgba(79,70,229,0.6)] transition-all"
                  >
                    <span>Open Your Dashboard</span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-transform duration-200 group-hover:translate-x-1">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </motion.button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/register">
                    <motion.button
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-7 py-3.5 text-sm sm:text-base font-bold text-white shadow-[0_10px_25px_-5px_rgba(79,70,229,0.45)] hover:shadow-[0_15px_30px_-5px_rgba(79,70,229,0.6)] transition-all"
                    >
                      <span>Start Planning Free</span>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-transform duration-200 group-hover:translate-x-1">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </motion.button>
                  </Link>

                  <a href="#demo">
                    <motion.button
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/80 px-6 py-3.5 text-sm sm:text-base font-semibold text-slate-800 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:border-slate-400 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Play className="h-4 w-4 text-indigo-600 dark:text-indigo-400 fill-indigo-600/20" />
                      <span>Interactive Demo</span>
                    </motion.button>
                  </a>
                </>
              )}
            </motion.div>
          </motion.div>

          {/* ================= 3D INTERACTIVE HERO SHOWCASE CARD ================= */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-8 max-w-5xl mx-auto perspective-1000"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <motion.div
              style={{
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
              }}
              className="relative rounded-3xl border border-white/70 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 p-5 sm:p-7 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] backdrop-blur-2xl transition-all duration-300 hover:shadow-[0_25px_60px_-10px_rgba(99,102,241,0.25)]"
            >
              {/* Floating Highlight Badge 1 (Top Left) */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="hidden lg:flex absolute -top-4 -left-5 z-20 items-center gap-2 rounded-2xl bg-white/95 dark:bg-slate-800/95 border border-indigo-100 dark:border-slate-700 p-2.5 shadow-xl backdrop-blur text-xs font-semibold text-slate-800 dark:text-slate-100"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Zero Math Arguments</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Automatic Debt Simplifier</p>
                </div>
              </motion.div>

              {/* Floating Highlight Badge 2 (Top Right) */}
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="hidden lg:flex absolute -top-4 -right-5 z-20 items-center gap-2 rounded-2xl bg-white/95 dark:bg-slate-800/95 border border-purple-100 dark:border-slate-700 p-2.5 shadow-xl backdrop-blur text-xs font-semibold text-slate-800 dark:text-slate-100"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-300">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Offline Vault</p>
                  <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Synced for all travelers</p>
                </div>
              </motion.div>

              {/* Card Top Row with live showcase trip context */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-lg shadow-md shadow-indigo-600/25 shrink-0">
                    <Compass className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
                        {SHOWCASE_TRIP.name}
                      </h2>
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-300">
                        {SHOWCASE_TRIP.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-indigo-500" /> {SHOWCASE_TRIP.location} • {SHOWCASE_TRIP.members.length} Travelers
                    </p>
                  </div>
                </div>

                {/* Live Travelers Stack */}
                <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex -space-x-1.5">
                    {SHOWCASE_TRIP.members.map((name, i) => (
                      <div
                        key={i}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900"
                        title={name}
                      >
                        {name[0]}
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                    {SHOWCASE_TRIP.members.length} Active
                  </span>
                </div>
              </div>

              {/* 3 Quick Grid Highlights Inside Hero */}
              <div className="grid gap-3 sm:grid-cols-3 mt-4">
                {/* 1. Next Activity */}
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3.5 dark:border-indigo-950 dark:bg-indigo-950/20">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Scheduled Plan
                    </span>
                    <Badge variant="accent">Day 1</Badge>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                    {SHOWCASE_TRIP.nextActivity}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {SHOWCASE_TRIP.nextTime}
                  </p>
                </div>

                {/* 2. Group Spend Live Glance */}
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3.5 dark:border-emerald-950 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> Total Spend
                    </span>
                    <Badge variant="success">Balanced</Badge>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    {formatCurrency(SHOWCASE_TRIP.totalSpend, SHOWCASE_TRIP.currency)}
                  </h3>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                    {formatCurrency(SHOWCASE_TRIP.totalSpend / SHOWCASE_TRIP.members.length, SHOWCASE_TRIP.currency)} / person
                  </p>
                </div>

                {/* 3. Real-time Tasks */}
                <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-3.5 dark:border-purple-950 dark:bg-purple-950/20">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Active Checklist
                    </span>
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300">Ready</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                    {SHOWCASE_TRIP.task}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Document: {SHOWCASE_TRIP.vaultDoc}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Trust stats row */}
          <div className="mt-8 max-w-4xl mx-auto rounded-2xl border border-slate-200/60 bg-white/60 p-4 shadow-glass-sm backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/50">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">100%</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Auditable Settlements</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">0 Math</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Disputes & Friction</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">Multi-Currency</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">INR, USD, EUR, GBP</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">100% Mobile</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Fast on any phone</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= INTERACTIVE WORKSPACE DEMO SHOWCASE ================= */}
      <section id="demo" className="py-10 sm:py-14 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <Badge variant="default" className="mb-2">Interactive Feature Studio</Badge>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Try the platform right here
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Click the tabs below to test timeline scheduling, instant debt reduction calculations, encrypted vaults, and task delegation.
            </p>
          </div>

          {/* Interactive Showcase Frame */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 overflow-hidden">
            {/* Top Workspace Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-50/80 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                  🧭
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Kyoto Autumn Squad</h3>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                      Live Workspace
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Kyoto & Osaka • 4 Members
                  </p>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex overflow-x-auto scrollbar-none rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800/80 gap-1">
                <button
                  onClick={() => setActiveDemoTab('itinerary')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeDemoTab === 'itinerary'
                      ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400 font-bold'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Itinerary
                </button>
                <button
                  onClick={() => setActiveDemoTab('expenses')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeDemoTab === 'expenses'
                      ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400 font-bold'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <span className="font-bold text-xs">{getCurrencySymbol(demoCurrency)}</span>
                  Split & Settle
                </button>
                <button
                  onClick={() => setActiveDemoTab('vault')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeDemoTab === 'vault'
                      ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400 font-bold'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Vault
                </button>
                <button
                  onClick={() => setActiveDemoTab('tasks')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeDemoTab === 'tasks'
                      ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400 font-bold'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Tasks ({completedTasksCount}/{demoTasks.length})
                </button>
              </div>
            </div>

            {/* Showcase Tab Contents with AnimatePresence */}
            <div className="p-5 sm:p-7 min-h-[380px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {/* TAB 1: ITINERARY PREVIEW */}
                {activeDemoTab === 'itinerary' && (
                  <motion.div
                    key="itinerary"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Day 1: Arrival & Fushimi Inari Sunset</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Kyoto, Japan</p>
                      </div>
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full">
                        3 Activities Scheduled
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/50 hover:border-indigo-300 transition">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                          <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                            <Clock className="h-3 w-3" /> 14:00
                          </span>
                          <Badge variant="secondary">Check-in</Badge>
                        </div>
                        <h5 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">Machiya Townhouse Check-In</h5>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" /> Gion District
                        </p>
                      </div>

                      <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-3.5 dark:border-indigo-900/60 dark:bg-indigo-950/30 shadow-sm">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                          <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                            <Clock className="h-3 w-3" /> 17:00
                          </span>
                          <Badge variant="accent">Highlight</Badge>
                        </div>
                        <h5 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">Torii Gates Sunset Hike ⛩️</h5>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" /> Fushimi Inari Taisha
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/50 hover:border-indigo-300 transition">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                          <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                            <Clock className="h-3 w-3" /> 20:00
                          </span>
                          <Badge variant="secondary">Dinner</Badge>
                        </div>
                        <h5 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">Kobe Beef Tasting at Gion</h5>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" /> Reservation under Alex
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 2: EXPENSES & SPLIT SIMULATOR */}
                {activeDemoTab === 'expenses' && (
                  <motion.div
                    key="expenses"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/50">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Trip Total Spend</p>
                        <p className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                          {formatCurrency(demoExpenseAmount * 100 * 3, demoCurrency)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">4 participants</p>
                      </div>

                      <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Your Balance</p>
                        <p className="mt-1 text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(demoExpenseAmount * 100 * 0.75, demoCurrency)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">You are owed money</p>
                      </div>

                      <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-3.5 dark:border-indigo-900/50 dark:bg-indigo-950/30">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Smart Settlement</p>
                        <p className="mt-1 text-xs sm:text-sm font-bold text-indigo-900 dark:text-indigo-200">
                          Maya pays Alex {formatCurrency((demoExpenseAmount / 4) * 100, demoCurrency)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-indigo-600 dark:text-indigo-400">1 direct transfer settles all</p>
                      </div>
                    </div>

                    {/* Interactive Split Simulator Control */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                        <div>
                          <h5 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">Interactive Expense Splitter</h5>
                          <p className="text-[11px] text-slate-500">Type an amount to calculate each member&apos;s share:</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="relative flex items-center">
                            <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-2.5 text-xs font-bold text-slate-400">
                              {getCurrencySymbol(demoCurrency)}
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="100"
                              value={demoExpenseAmount}
                              onChange={(e) => setDemoExpenseAmount(Number(e.target.value) || 0)}
                              className="w-24 rounded-lg border border-slate-200 pl-6 pr-2 py-1 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-right"
                            />
                          </div>

                          <select
                            value={demoCurrency}
                            onChange={(e) => setDemoCurrency(e.target.value)}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                          >
                            <option value="INR">INR (₹)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="JPY">JPY (¥)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-center">
                        {['Alex (Payer)', 'Maya', 'Liam', 'Elena'].map((member) => (
                          <div key={member} className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60">
                            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">{member}</p>
                            <p className="mt-0.5 text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400">
                              {formatCurrency((demoExpenseAmount / 4) * 100, demoCurrency)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 3: VAULT PREVIEW */}
                {activeDemoTab === 'vault' && (
                  <motion.div
                    key="vault"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Encrypted Travel Vault</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Centralized offline-accessible repository for the entire squad</p>
                      </div>
                      <Badge variant="success">Passports & Vouchers Secured</Badge>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/50 flex items-start justify-between">
                        <div>
                          <span className="text-xl">✈️</span>
                          <h5 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm mt-1">Flight_JL041_Boarding_Pass.pdf</h5>
                          <p className="text-[11px] text-slate-500">2.1 MB • Japan Airlines</p>
                        </div>
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">PDF</span>
                      </div>

                      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/50 flex items-start justify-between">
                        <div>
                          <span className="text-xl">🏡</span>
                          <h5 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm mt-1">Machiya_Gion_Booking.pdf</h5>
                          <p className="text-[11px] text-slate-500">1.4 MB • Confirmation #9182</p>
                        </div>
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">PDF</span>
                      </div>

                      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/50 flex items-start justify-between">
                        <div>
                          <span className="text-xl">🚅</span>
                          <h5 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm mt-1">Shinkansen_Bullet_Passes.png</h5>
                          <p className="text-[11px] text-slate-500">920 KB • Tokyo → Kyoto</p>
                        </div>
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">IMAGE</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 4: TASKS PREVIEW */}
                {activeDemoTab === 'tasks' && (
                  <motion.div
                    key="tasks"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Collaborative Task Checklist</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Click any task below to toggle completion interactively:
                        </p>
                      </div>
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Progress: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{Math.round((completedTasksCount / demoTasks.length) * 100)}%</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                        animate={{ width: `${(completedTasksCount / demoTasks.length) * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>

                    <div className="space-y-2">
                      {demoTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => toggleTask(task.id)}
                          className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition active:scale-99 ${
                            task.done
                              ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-950 dark:bg-emerald-950/20 text-slate-500'
                              : 'border-slate-200 bg-slate-50/70 hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex h-4.5 w-4.5 items-center justify-center rounded-md border transition ${
                                task.done
                                  ? 'border-emerald-500 bg-emerald-500 text-white'
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}
                            >
                              {task.done && <Check className="h-3 w-3" />}
                            </div>
                            <span className={`text-xs sm:text-sm font-medium ${task.done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
                              {task.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {task.assignee}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">{task.due}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CORE FEATURES BENTO GRID ================= */}
      <section id="features" className="py-10 sm:py-14 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <Badge variant="default" className="mb-2">Engineered for Travel Harmony</Badge>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Everything your group needs in one hub
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
              Designed from the ground up for modern travel crews, eliminating repetitive questions and financial anxiety.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="trip-glass-card rounded-3xl p-6 relative transition-all duration-300 shadow-md hover:shadow-xl hover:border-indigo-400/60"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-300 mb-4 shadow-inner">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Visual Timeline Itinerary</h3>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Day-by-day interactive timeline with locations, start/end times, durations, and group notes.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="trip-glass-card rounded-3xl p-6 relative transition-all duration-300 shadow-md hover:shadow-xl hover:border-emerald-400/60"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-300 mb-4 shadow-inner">
                <DollarSign className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Smart Split & Settle</h3>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Record expenses in multiple currencies. Automatic debt graph simplification so you settle with minimal transactions.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="trip-glass-card rounded-3xl p-6 relative transition-all duration-300 shadow-md hover:shadow-xl hover:border-purple-400/60"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/70 dark:text-purple-300 mb-4 shadow-inner">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Encrypted Travel Vault</h3>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Centralized storage for flight tickets, Airbnb confirmations, and passports. Accessible by the entire group anytime.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="trip-glass-card rounded-3xl p-6 relative transition-all duration-300 shadow-md hover:shadow-xl hover:border-amber-400/60"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-300 mb-4 shadow-inner">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Role-Based Collaboration</h3>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Trip owners, admins, and members. 1-click email and copyable invitation links for seamless group onboarding.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS & SOCIAL PROOF ================= */}
      <section className="py-10 sm:py-14 relative bg-slate-100/50 dark:bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="flex items-center justify-center gap-1 text-amber-400 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400" />
              ))}
            </div>
            <h2 className="font-display text-2.5xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Loved by many Travel Squads
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Here is what real travelers say after switching to TripOS:
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div className="trip-glass-card rounded-3xl p-5 shadow-sm space-y-3">
              <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                &ldquo;We traveled with 7 friends to Japan for 12 days. TripOS simplified over 80 shared meals and train passes into 3 final payments. No more awkward math!&rdquo;
              </p>
              <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  SK
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Sidhant K.</p>
                  <p className="text-[10px] text-slate-500">Tokyo & Kyoto Trip</p>
                </div>
              </div>
            </div>

            <div className="trip-glass-card rounded-3xl p-5 shadow-sm space-y-3">
              <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                &ldquo;Having the boarding passes and Airbnb entry codes in the Vault saved us when we had zero cellular connection in the Italian mountains.&rdquo;
              </p>
              <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
                  MK
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Maya K.</p>
                  <p className="text-[10px] text-slate-500">Dolomites & Amalfi Crew</p>
                </div>
              </div>
            </div>

            <div className="trip-glass-card rounded-3xl p-5 shadow-sm space-y-3">
              <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                &ldquo;Finally, an app where I don&apos;t have to be the sole trip organizer. Everyone claimed their tasks and added their favorite spots to the timeline.&rdquo;
              </p>
              <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  LT
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Liam T.</p>
                  <p className="text-[10px] text-slate-500">Bali Surf Expedition</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= COMPARISON TABLE ================= */}
      <section className="py-10 sm:py-14 relative">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Why groups switch to TripOS
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
              The difference between spending your holiday arguing over math and enjoying every moment together.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xl overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 text-center font-bold text-xs sm:text-sm">
              <div className="p-3.5 bg-red-50/40 text-red-700 dark:bg-red-950/20 dark:text-red-400">
                ❌ Traditional Group Travel Chaos
              </div>
              <div className="p-3.5 bg-emerald-50/40 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                ✨ The TripOS Standard
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
              {[
                ['Scattered WhatsApp messages and lost screenshots', 'Single unified real-time dashboard for the entire trip'],
                ['"Who owes what?" arguments after the trip ends', 'Deterministic math with automated debt-simplification settlement'],
                ['Lost PDF tickets and panic at boarding gates', 'Offline-friendly centralized vault for all group travel files'],
                ['One person gets stuck doing all the planning', 'Collaborative delegation with task owners and due dates'],
                ['Clunky spreadsheets broken on mobile screens', 'Mobile-first fluid responsive design designed for on-the-go thumb use'],
              ].map(([oldWay, newWay], i) => (
                <div key={i} className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800/80 p-3 sm:p-4 items-center">
                  <div className="text-slate-600 dark:text-slate-400 pr-2.5 text-xs">{oldWay}</div>
                  <div className="text-slate-900 dark:text-slate-100 font-semibold pl-2.5 flex items-center gap-2 text-xs sm:text-sm">
                    <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{newWay}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS (3 STEPS) ================= */}
      <section id="how-it-works" className="py-10 sm:py-14 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <Badge variant="default" className="mb-2">Simple 3-Step Journey</Badge>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              From idea to touchdown in minutes
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3 relative">
            <motion.div whileHover={{ y: -4 }} className="trip-glass-card rounded-3xl p-6 relative shadow-md hover:shadow-xl transition">
              <span className="text-4xl font-black text-indigo-600/15 dark:text-indigo-400/15 absolute top-5 right-5">01</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold text-base mb-4 shadow-md shadow-indigo-600/25">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Create & Invite</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Create a trip workspace in 10 seconds. Share your private invite link with friends via WhatsApp, iMessage, or email.
              </p>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} className="trip-glass-card rounded-3xl p-6 relative shadow-md hover:shadow-xl transition">
              <span className="text-4xl font-black text-indigo-600/15 dark:text-indigo-400/15 absolute top-5 right-5">02</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold text-base mb-4 shadow-md shadow-indigo-600/25">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Coordinate & Plan</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Add timeline activities, assign bookings to members, and store boarding passes & villa vouchers in the shared vault.
              </p>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} className="trip-glass-card rounded-3xl p-6 relative shadow-md hover:shadow-xl transition">
              <span className="text-4xl font-black text-indigo-600/15 dark:text-indigo-400/15 absolute top-5 right-5">03</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold text-base mb-4 shadow-md shadow-indigo-600/25">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Spend & Settle</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Log expenses on the go. TripOS automatically computes net balances and generates the fastest path to zero.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section id="faq" className="py-10 sm:py-14 relative">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <Badge variant="default" className="mb-2">Frequently Asked Questions</Badge>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Everything you need to know
            </h2>
          </div>

          <div className="space-y-2.5">
            {[
              {
                q: 'How does the TripOS expense split algorithm work?',
                a: 'TripOS tracks each expense along with who paid and who participated. When it is time to settle, our debt simplification algorithm computes the minimal number of transactions required to resolve all IOUs completely, eliminating messy circular debts.',
              },
              {
                q: 'Can members add activities and files without an account initially?',
                a: 'Anyone invited can sign up in 15 seconds to gain full collaborative access. Trip owners can invite members via email or share a private link directly.',
              },
              {
                q: 'Does TripOS support international currencies?',
                a: 'Yes! TripOS supports multiple currencies including INR, USD, EUR, GBP, and JPY, ensuring international trips and cross-border travel are easy to manage without conversion headaches.',
              },
              {
                q: 'Is TripOS mobile-friendly?',
                a: 'TripOS is built 100% mobile-first. You get a fluid, native-app-like experience on iPhones, Androids, tablets, and desktops with offline vault accessibility.',
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="trip-glass-card rounded-2xl overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-semibold text-slate-900 dark:text-white text-xs sm:text-sm"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                      openFaq === idx ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FINAL HIGH-CONVERSION CTA ================= */}
      <section className="py-10 sm:py-16 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 sm:p-12 text-center text-white shadow-2xl overflow-hidden"
          >
            {/* Ambient pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_70%)] pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-5">
              <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                Ready to plan your best group trip yet?
              </h2>
              <p className="text-indigo-100 text-xs sm:text-base">
                Join thousands of friends, families, and travel squads traveling stress-free with TripOS.
              </p>
              <div className="pt-1">
                <Link href={isAuthenticated ? '/dashboard' : '/auth/register'}>
                  <motion.button
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-full bg-white px-8 py-3.5 text-sm sm:text-base font-bold text-indigo-700 shadow-xl transition-all duration-200 hover:bg-indigo-50 hover:shadow-2xl"
                  >
                    {isAuthenticated ? 'Go to Dashboard' : 'Get Started for Free'}
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-slate-200/60 bg-white/70 py-8 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/70 mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm">
                <Compass className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">TripOS</span>
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
