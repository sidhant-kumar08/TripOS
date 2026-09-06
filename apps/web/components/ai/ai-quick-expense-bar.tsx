'use client';

import * as React from 'react';
import { useState } from 'react';
import { Sparkles, ArrowRight, Check, AlertCircle, RefreshCw, X, User } from 'lucide-react';
import { aiApi, expensesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ResolvedMember {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

interface ExpenseProposal {
  amountMinor: number;
  currency: string;
  description: string;
  payer: ResolvedMember | null;
  participants: ResolvedMember[];
  splitMode: 'EQUAL' | 'EXACT' | 'PERCENTAGE';
  confidence: number;
  needsClarification: boolean;
  clarificationMessage?: string;
  unresolvedAliases: string[];
}

interface AIQuickExpenseBarProps {
  tripId: string;
  onExpenseCreated: () => void;
  onOpenEditInForm?: (prefill: {
    description: string;
    amount: string;
    currency: string;
    payerId: string;
    participantIds: string[];
  }) => void;
}

export function AIQuickExpenseBar({ tripId, onExpenseCreated, onOpenEditInForm }: AIQuickExpenseBarProps) {
  const [input, setInput] = useState('');
  const [parsing, setParsing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [proposal, setProposal] = useState<ExpenseProposal | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || parsing) return;

    setError(null);
    setParsing(true);
    setProposal(null);

    try {
      const res = await aiApi.parseExpense(tripId, input.trim());
      setProposal(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to interpret expense. Please try rephrasing.');
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmDirect = async () => {
    if (!proposal || !proposal.payer || proposal.participants.length === 0 || confirming) return;

    setConfirming(true);
    setError(null);

    try {
      const splitAmount = Math.floor(proposal.amountMinor / proposal.participants.length);

      const payload = {
        description: proposal.description,
        amount: Math.round(proposal.amountMinor), // backend accepts integer minor units / cents
        currency: proposal.currency || 'INR',
        category: 'EXPENSE',
        payerId: proposal.payer.id,
        splits: proposal.participants.map((p) => ({
          userId: p.id,
          amount: splitAmount,
        })),
      };

      await expensesApi.create(tripId, payload);
      setInput('');
      setProposal(null);
      onExpenseCreated();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create expense. You can edit in form.');
    } finally {
      setConfirming(false);
    }
  };

  const handleEditInForm = () => {
    if (!proposal || !onOpenEditInForm) return;

    const amountMajor = (proposal.amountMinor / 100).toString();
    onOpenEditInForm({
      description: proposal.description,
      amount: amountMajor,
      currency: proposal.currency || 'INR',
      payerId: proposal.payer?.id || '',
      participantIds: proposal.participants.map((p) => p.id),
    });
    setProposal(null);
  };

  return (
    <div className="mb-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/30 via-slate-900/60 to-purple-950/30 p-4 shadow-xl backdrop-blur-md">
      {/* Header Label */}
      <div className="mb-2 flex items-center justify-between text-xs text-indigo-300/80">
        <span className="flex items-center gap-1.5 font-medium">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
          Natural-Language Expense Parser (Hindi, Hinglish, English)
        </span>
        <span className="text-[11px] text-slate-400">
          e.g. &ldquo;Rahul ne hotel ke 5000 diye&rdquo; or &ldquo;I paid 5k for cab&rdquo;
        </span>
      </div>

      {/* Input Bar */}
      <form onSubmit={handleParse} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type naturally in Hindi, Hinglish or English..."
            className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
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

      {/* Error Banner */}
      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Structured Proposal Review Card */}
      {proposal && (
        <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/90 p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              AI Extracted Proposal (Review Before Adding)
            </span>
            <span className="text-[11px] text-slate-400">
              Confidence: {Math.round((proposal.confidence || 0.9) * 100)}%
            </span>
          </div>

          {proposal.needsClarification ? (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-200 mb-3">
              <p className="font-medium flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                Clarification Needed:
              </p>
              <p className="mt-1 text-slate-300">
                {proposal.clarificationMessage || 'Some information could not be verified automatically.'}
              </p>
            </div>
          ) : null}

          {/* Proposal Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
            <div className="rounded-lg bg-white/5 p-2.5">
              <span className="text-slate-400 block mb-0.5">Description</span>
              <span className="font-medium text-white">{proposal.description}</span>
            </div>
            <div className="rounded-lg bg-white/5 p-2.5">
              <span className="text-slate-400 block mb-0.5">Amount</span>
              <span className="font-semibold text-emerald-400 text-sm">
                ₹{(proposal.amountMinor / 100).toLocaleString('en-IN')} {proposal.currency}
              </span>
            </div>
            <div className="rounded-lg bg-white/5 p-2.5">
              <span className="text-slate-400 block mb-0.5">Paid By</span>
              <span className="font-medium text-white flex items-center gap-1">
                <User className="h-3 w-3 text-indigo-400" />
                {proposal.payer?.name || 'Unresolved'}
              </span>
            </div>
            <div className="rounded-lg bg-white/5 p-2.5">
              <span className="text-slate-400 block mb-0.5">Split With</span>
              <span className="font-medium text-white">
                {proposal.participants.length} member{proposal.participants.length === 1 ? '' : 's'} (Equal)
              </span>
            </div>
          </div>

          {/* Participants Badges */}
          <div className="mb-4 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 mr-1 text-[11px]">Members:</span>
            {proposal.participants.map((p) => (
              <Badge key={p.id} variant="secondary" className="text-[11px] bg-white/5 border-white/10 text-slate-300">
                {p.name}
              </Badge>
            ))}
          </div>

          {/* Action Confirmation Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
            {onOpenEditInForm && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEditInForm}
                className="text-xs text-slate-300 hover:text-white"
              >
                Edit in Form
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              disabled={proposal.needsClarification || !proposal.payer || confirming}
              onClick={handleConfirmDirect}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-4 rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
            >
              {confirming ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Confirm & Create Expense
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
