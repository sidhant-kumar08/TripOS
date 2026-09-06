'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Bot,
  Send,
  ArrowRight,
  Receipt,
  ListTodo,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { aiApi } from '@/lib/api';
import { AIQuickExpenseBar } from '@/components/ai/ai-quick-expense-bar';
import { AIQuickTaskBar } from '@/components/ai/ai-quick-task-bar';

interface Trip {
  id: string;
  name: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
}

interface DashboardAIHubProps {
  trips: Trip[];
  onDataChanged?: () => void;
}

const QUICK_QUESTIONS = [
  'What do I need to do?',
  'Who owes me money or what is my balance?',
  'Are we ready for the trip?',
  'What tasks are still pending?',
];

export function DashboardAIHub({ trips, onDataChanged }: DashboardAIHubProps) {
  const router = useRouter();
  const [selectedTripId, setSelectedTripId] = useState<string>(trips[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'ask' | 'expense' | 'task'>('ask');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{
    question: string;
    answer: string;
    suggestedActions: Array<{ label: string; actionType: string; targetPath?: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Sync selected trip when trips prop updates
  React.useEffect(() => {
    if (trips.length > 0 && (!selectedTripId || !trips.find((t) => t.id === selectedTripId))) {
      setSelectedTripId(trips[0].id);
    }
  }, [trips, selectedTripId]);

  const selectedTrip = trips.find((t) => t.id === selectedTripId) || trips[0];

  if (!trips || trips.length === 0) {
    return null;
  }

  const handleAsk = async (qText: string) => {
    const q = qText.trim();
    if (!q || !selectedTripId || loading) return;

    setError(null);
    setLoading(true);

    try {
      const res = await aiApi.ask(selectedTripId, q);
      setResponse(res.data);
      setQuestion('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to query TripOS AI. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseCreated = () => {
    setSuccessToast('Expense created and split successfully!');
    setTimeout(() => setSuccessToast(null), 4000);
    onDataChanged?.();
  };

  const handleTaskCreated = () => {
    setSuccessToast('Task logged and assigned successfully!');
    setTimeout(() => setSuccessToast(null), 4000);
    onDataChanged?.();
  };

  return (
    <div className="mb-8 overflow-hidden rounded-3xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/70 p-6 shadow-lg shadow-indigo-500/5 backdrop-blur-md dark:border-indigo-900/60 dark:bg-gradient-to-br dark:from-slate-900/90 dark:via-indigo-950/20 dark:to-slate-900/90">
      {/* Header & Trip Selector Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-indigo-100/80 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-600/30">
            <Bot className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                TripOS AI Operations
              </h3>
              <Badge variant="accent" className="text-[10px] font-semibold py-0.5 px-2">
                <Sparkles className="h-3 w-3 mr-1 text-amber-500" />
                Copilot Ready
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Natural language questions, Indian Hinglish expense logging, and zero-trust task capture.
            </p>
          </div>
        </div>

        {/* Selected Trip Switcher */}
        {trips.length > 1 ? (
          <div className="relative flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Trip:</span>
            <div className="relative">
              <select
                value={selectedTripId}
                onChange={(e) => {
                  setSelectedTripId(e.target.value);
                  setResponse(null);
                }}
                className="appearance-none rounded-xl border border-indigo-200/80 bg-white/90 py-1.5 pl-3 pr-8 text-xs font-bold text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-indigo-900 dark:bg-slate-800 dark:text-white"
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
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/50 py-1 px-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
            <MapPin className="h-3.5 w-3.5 text-indigo-500" />
            <span>{selectedTrip.name}</span>
          </div>
        ) : null}
      </div>

      {/* Quick Mode Navigation Tabs */}
      <div className="mt-5 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
        <button
          onClick={() => setActiveTab('ask')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'ask'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          Ask TripOS
        </button>

        <button
          onClick={() => setActiveTab('expense')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'expense'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
          }`}
        >
          <Receipt className="h-4 w-4" />
          Quick Expense
        </button>

        <button
          onClick={() => setActiveTab('task')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'task'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
          }`}
        >
          <ListTodo className="h-4 w-4" />
          Quick Task
        </button>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3 text-xs font-bold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* TAB 1: ASK TRIPOS */}
      {activeTab === 'ask' && (
        <div className="mt-4 space-y-4">
          {/* Quick Question Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Try asking:
            </span>
            {QUICK_QUESTIONS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleAsk(chip)}
                disabled={loading}
                className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:border-indigo-600 dark:hover:bg-slate-800"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(question);
            }}
            className="flex items-center gap-2 rounded-2xl border border-indigo-200/90 bg-white p-2 shadow-inner dark:border-indigo-900/70 dark:bg-slate-900/90"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={`Ask anything about "${selectedTrip?.name || 'this trip'}" (e.g., 'What do I need to do?', 'Who owes me money?')...`}
              disabled={loading}
              className="flex-1 bg-transparent px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
            />
            <Button
              type="submit"
              disabled={!question.trim() || loading}
              isLoading={loading}
              size="sm"
              className="rounded-xl px-4"
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              Ask
            </Button>
          </form>

          {/* Error display */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* AI Response Card */}
          {response && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-sm dark:border-indigo-900/50 dark:bg-indigo-950/30 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                    Q: {response.question}
                  </p>
                  <p className="text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-100">
                    {response.answer}
                  </p>

                  {/* Suggested Deep-link Action Buttons */}
                  {response.suggestedActions && response.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/40">
                      {response.suggestedActions.map((act, i) => (
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
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: QUICK EXPENSE */}
      {activeTab === 'expense' && (
        <div className="mt-4">
          <AIQuickExpenseBar
            tripId={selectedTripId}
            onExpenseCreated={handleExpenseCreated}
          />
        </div>
      )}

      {/* TAB 3: QUICK TASK */}
      {activeTab === 'task' && (
        <div className="mt-4">
          <AIQuickTaskBar
            tripId={selectedTripId}
            onTaskCreated={handleTaskCreated}
          />
        </div>
      )}
    </div>
  );
}
