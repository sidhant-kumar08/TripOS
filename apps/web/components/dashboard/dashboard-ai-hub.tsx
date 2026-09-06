'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Send,
  ArrowRight,
  Receipt,
  AlertCircle,
  MapPin,
  ChevronDown,
  Calendar,
  Compass,
  ListTodo,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { aiApi } from '@/lib/api';

interface Trip {
  id: string;
  name: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
}

interface UnifiedChatResult {
  actionType: 'TRIP_CREATED' | 'EXPENSE_CREATED' | 'TASK_CREATED' | 'ANSWER';
  message: string;
  trip?: {
    id: string;
    name: string;
    destination?: string;
    startDate?: string;
    endDate?: string;
  };
  expense?: {
    id: string;
    description: string;
    amountFormatted: string;
    payerName: string;
    participantsCount: number;
    splitPerPersonFormatted: string;
  };
  task?: {
    id: string;
    title: string;
    assigneeName?: string;
    dueDateFormatted?: string;
    priority: string;
  };
  suggestedActions?: Array<{ label: string; actionType: string; targetPath?: string }>;
}

interface DashboardAIHubProps {
  trips: Trip[];
  onDataChanged?: () => void;
}

const SUGGESTED_IDEAS = [
  { label: 'What do I need to do?', icon: '💬' },
  { label: 'Spent 5000 on dinner', icon: '💸' },
  { label: 'Plan a trip to Manali with friends', icon: '✈️' },
  { label: 'Who owes me money?', icon: '💰' },
  { label: 'Remind Rahul to book cab tomorrow', icon: '📋' },
];

export function DashboardAIHub({ trips, onDataChanged }: DashboardAIHubProps) {
  const router = useRouter();
  const [selectedTripId, setSelectedTripId] = useState<string>(trips[0]?.id || '');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UnifiedChatResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync selected trip if trips array changes
  React.useEffect(() => {
    if (trips.length > 0 && (!selectedTripId || !trips.find((t) => t.id === selectedTripId))) {
      setSelectedTripId(trips[0].id);
    }
  }, [trips, selectedTripId]);

  const selectedTrip = trips.find((t) => t.id === selectedTripId) || trips[0];

  const handleSend = async (messageText: string) => {
    const text = messageText.trim();
    if (!text || loading) return;

    setError(null);
    setLoading(true);

    try {
      const res = await aiApi.chat(text, selectedTripId || undefined);
      setResult(res.data);
      setInput('');

      // If an expense, trip, or task was created, trigger data refresh for dashboard metrics
      if (res.data.actionType === 'TRIP_CREATED' || res.data.actionType === 'EXPENSE_CREATED' || res.data.actionType === 'TASK_CREATED') {
        onDataChanged?.();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try rephrasing your message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8 overflow-hidden rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/80 p-6 shadow-md shadow-indigo-500/5 backdrop-blur-md dark:border-indigo-900/60 dark:bg-gradient-to-br dark:from-slate-900/95 dark:via-indigo-950/20 dark:to-slate-900/95">
      {/* Friendly Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-indigo-100/70 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/25">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Trip Assistant
              </h3>
              <Badge variant="accent" className="text-[10px] font-semibold py-0.5 px-2">
                Always Ready
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ask questions, log expenses, add tasks, or plan new trips in plain words.
            </p>
          </div>
        </div>

        {/* Selected Trip Switcher (if user has multiple trips) */}
        {trips.length > 1 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">For:</span>
            <div className="relative">
              <select
                value={selectedTripId}
                onChange={(e) => {
                  setSelectedTripId(e.target.value);
                  setResult(null);
                }}
                className="appearance-none rounded-xl border border-indigo-200/80 bg-white/95 py-1.5 pl-3 pr-8 text-xs font-bold text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-indigo-900 dark:bg-slate-800 dark:text-white"
              >
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.destination ? `(${t.destination})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        ) : selectedTrip ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60 py-1.5 px-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
            <MapPin className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Active: {selectedTrip.name}</span>
          </div>
        ) : null}
      </div>

      {/* Suggested Quick Chips */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
          Try saying:
        </span>
        {SUGGESTED_IDEAS.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip.label)}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-indigo-600 dark:hover:bg-slate-800"
          >
            <span>{chip.icon}</span>
            <span>{chip.label}</span>
          </button>
        ))}
      </div>

      {/* Unified Conversational Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="mt-4 flex items-center gap-2 rounded-2xl border border-indigo-200/90 bg-white p-2 shadow-inner dark:border-indigo-900/70 dark:bg-slate-900/90"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell your assistant anything (e.g., 'Spent 5000 on dinner', 'Plan a trip to Manali', 'What do I need to do?')..."
          disabled={loading}
          className="flex-1 bg-transparent px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
        />
        <Button
          type="submit"
          disabled={!input.trim() || loading}
          isLoading={loading}
          size="sm"
          className="rounded-xl px-4 font-semibold"
        >
          <Send className="h-3.5 w-3.5 mr-1" />
          Send
        </Button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Actionable Results Card */}
      {result && (
        <div className="mt-4 rounded-2xl border border-indigo-200/90 bg-indigo-50/60 p-5 shadow-sm dark:border-indigo-900/60 dark:bg-indigo-950/40 animate-in fade-in slide-in-from-top-2">
          {/* CASE 1: TRIP CREATED */}
          {result.actionType === 'TRIP_CREATED' && result.trip && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                <Compass className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span>Trip Created Successfully!</span>
              </div>
              <p className="text-sm text-slate-800 dark:text-slate-100 font-medium">
                {result.message}
              </p>
              <div className="rounded-xl bg-white/90 p-4 border border-emerald-200/80 dark:bg-slate-900/80 dark:border-emerald-900/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {result.trip.name}
                  </h4>
                  {result.trip.destination && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {result.trip.destination}
                    </p>
                  )}
                  {result.trip.startDate && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {result.trip.startDate} → {result.trip.endDate || 'Flexible'}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => router.push(`/trips/${result.trip?.id}`)}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shrink-0"
                >
                  Open Trip Workspace
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* CASE 2: EXPENSE CREATED */}
          {result.actionType === 'EXPENSE_CREATED' && result.expense && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-sm">
                <Receipt className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span>Expense Added to Trip</span>
              </div>
              <p className="text-sm text-slate-800 dark:text-slate-100 font-medium">
                {result.message}
              </p>
              <div className="rounded-xl bg-white/90 p-4 border border-indigo-200/80 dark:bg-slate-900/80 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {result.expense.amountFormatted}
                    </span>
                    <Badge variant="default" className="text-xs">
                      {result.expense.description}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Paid by <strong>{result.expense.payerName}</strong> • {result.expense.splitPerPersonFormatted} / person ({result.expense.participantsCount} members)
                  </p>
                </div>
                {result.suggestedActions?.map((act, i) => (
                  <Button
                    key={i}
                    onClick={() => act.targetPath && router.push(act.targetPath)}
                    size="sm"
                    className="font-bold shrink-0"
                  >
                    {act.label}
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* CASE 3: TASK CREATED */}
          {result.actionType === 'TASK_CREATED' && result.task && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-sm">
                <ListTodo className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span>Task Added</span>
              </div>
              <p className="text-sm text-slate-800 dark:text-slate-100 font-medium">
                {result.message}
              </p>
              <div className="rounded-xl bg-white/90 p-4 border border-indigo-200/80 dark:bg-slate-900/80 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {result.task.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {result.task.assigneeName ? `Assigned to ${result.task.assigneeName}` : 'Unassigned'}
                    {result.task.dueDateFormatted ? ` • Due ${result.task.dueDateFormatted}` : ''}
                  </p>
                </div>
                {result.suggestedActions?.map((act, i) => (
                  <Button
                    key={i}
                    onClick={() => act.targetPath && router.push(act.targetPath)}
                    size="sm"
                    className="font-bold shrink-0"
                  >
                    {act.label}
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* CASE 4: GROUNDED ANSWER */}
          {result.actionType === 'ANSWER' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="h-4 w-4" />
                <span>Response</span>
              </div>
              <p className="text-sm text-slate-800 dark:text-slate-100 font-medium leading-relaxed">
                {result.message}
              </p>
              {result.suggestedActions && result.suggestedActions.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/40">
                  {result.suggestedActions.map((act, i) => (
                    <button
                      key={i}
                      onClick={() => act.targetPath && router.push(act.targetPath)}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95"
                    >
                      {act.label}
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
