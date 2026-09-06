'use client';

import * as React from 'react';
import { useState } from 'react';
import { Sparkles, ArrowRight, Check, AlertCircle, RefreshCw, X, User, Calendar } from 'lucide-react';
import { aiApi, tasksApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ResolvedMember {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

interface TaskProposal {
  title: string;
  assignee: ResolvedMember | null;
  dueDate: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  context?: string;
  confidence: number;
  needsClarification: boolean;
  clarificationMessage?: string;
}

interface AIQuickTaskBarProps {
  tripId: string;
  onTaskCreated: () => void;
}

export function AIQuickTaskBar({ tripId, onTaskCreated }: AIQuickTaskBarProps) {
  const [input, setInput] = useState('');
  const [parsing, setParsing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [proposal, setProposal] = useState<TaskProposal | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || parsing) return;

    setError(null);
    setParsing(true);
    setProposal(null);

    try {
      const res = await aiApi.parseTask(tripId, input.trim());
      setProposal(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to interpret task. Please try rephrasing.');
    } finally {
      setParsing(false);
    }
  };

  const handleConfirm = async () => {
    if (!proposal || confirming) return;

    setConfirming(true);
    setError(null);

    try {
      const payload: Record<string, any> = {
        title: proposal.title,
        status: 'OPEN',
      };

      if (proposal.assignee?.id) {
        payload.assignedTo = proposal.assignee.id;
      }

      if (proposal.dueDate) {
        payload.dueDate = new Date(proposal.dueDate).toISOString();
      }

      await tasksApi.create(tripId, payload);
      setInput('');
      setProposal(null);
      onTaskCreated();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create task. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 via-slate-900/60 to-blue-950/30 p-4 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between text-xs text-cyan-300/80">
        <span className="flex items-center gap-1.5 font-medium">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
          Natural-Language Task Creator (Conversational Dates & Assignees)
        </span>
        <span className="text-[11px] text-slate-400">
          e.g. &ldquo;Priya ko cab book krne bol dena kal shaam tak&rdquo; or &ldquo;kal 7 bje airport jana h&rdquo;
        </span>
      </div>

      {/* Input Form */}
      <form onSubmit={handleParse} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type naturally in Hindi, Hinglish or English..."
            className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
          {input && (
            <button
              type="button"
              onClick={() => {
                setInput('');
                setProposal(null);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          type="submit"
          disabled={!input.trim() || parsing}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-4 rounded-xl flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 transition-all active:scale-95"
        >
          {parsing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Parse <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Error */}
      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Proposal Card */}
      {proposal && (
        <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/90 p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-cyan-400" />
              Proposed Task
            </span>
            <span className="text-[11px] text-slate-400">
              Confidence: {Math.round((proposal.confidence || 0.9) * 100)}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mb-4">
            <div className="rounded-lg bg-white/5 p-2.5 md:col-span-1">
              <span className="text-slate-400 block mb-0.5">Task Title</span>
              <span className="font-semibold text-white">{proposal.title}</span>
            </div>
            <div className="rounded-lg bg-white/5 p-2.5">
              <span className="text-slate-400 block mb-0.5">Assignee</span>
              <span className="font-medium text-white flex items-center gap-1">
                <User className="h-3 w-3 text-cyan-400" />
                {proposal.assignee?.name || 'Unassigned'}
              </span>
            </div>
            <div className="rounded-lg bg-white/5 p-2.5">
              <span className="text-slate-400 block mb-0.5">Due Date & Priority</span>
              <span className="font-medium text-white flex items-center gap-2">
                <span className="flex items-center gap-1 text-slate-300">
                  <Calendar className="h-3 w-3 text-cyan-400" />
                  {proposal.dueDate ? proposal.dueDate : 'No date'}
                </span>
                <Badge variant={proposal.priority === 'URGENT' ? 'destructive' : proposal.priority === 'HIGH' ? 'warning' : 'secondary'} className="text-[10px]">
                  {proposal.priority}
                </Badge>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setProposal(null)}
              className="text-xs text-slate-300 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={confirming}
              onClick={handleConfirm}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium px-4 rounded-lg flex items-center gap-1.5 shadow-lg shadow-cyan-600/20"
            >
              {confirming ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Confirm & Create Task
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
