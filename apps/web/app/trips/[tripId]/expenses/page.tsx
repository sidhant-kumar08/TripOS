'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Plus,
  ArrowRightLeft,
  Trash2,
  Receipt,
  Edit3,
  History,
  BookOpen,
  CheckCircle2,
  Clock,
  User,
  UserCheck,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/runtime-config';
import { useAuth } from '@/lib/auth-context';
import { PageShell } from '@/components/ui/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { StatCard } from '@/components/shared/stat-card';
import { EmptyState } from '@/components/shared/empty-state';
import { formatCurrency, formatDate, getCurrencySymbol } from '@/lib/utils';
import { expensesApi } from '@/lib/api';

interface ExpenseSplit {
  userId: string;
  amount: number;
  user?: {
    id: string;
    name?: string;
    email?: string;
  };
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  payerId: string;
  payer?: {
    id: string;
    name?: string;
    email?: string;
  };
  addedBy?: {
    id: string;
    name?: string;
    email?: string;
  };
  payerName?: string;
  currency: string;
  category?: 'EXPENSE' | 'LEND_BORROW' | 'SETTLEMENT';
  splits: ExpenseSplit[];
  editCount?: number;
  createdAt: string;
  updatedAt?: string;
}

interface Settlement {
  from: string;
  fromName?: string;
  to: string;
  toName?: string;
  amount: number;
}

interface BalanceItem {
  fromUserId: string;
  fromUser?: { id: string; name?: string; email?: string };
  toUserId: string;
  toUser?: { id: string; name?: string; email?: string };
  amount: number; // positive: fromUser owes toUser
}

interface AuditLog {
  id: string;
  action: string;
  details?: string;
  changes?: Record<string, any>;
  createdAt: string;
  user?: {
    id: string;
    name?: string;
    email?: string;
    avatar?: string;
  };
}

export default function ExpensesPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { user } = useAuth();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [tripMembers, setTripMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'expenses' | 'recordbook' | 'settlements'>('expenses');

  // Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [category, setCategory] = useState<'EXPENSE' | 'LEND_BORROW' | 'SETTLEMENT'>('EXPENSE');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [payerId, setPayerId] = useState<string>('');
  const [borrowerId, setBorrowerId] = useState<string>('');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [changeReason, setChangeReason] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Audit History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<AuditLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedExpenseForHistory, setSelectedExpenseForHistory] = useState<Expense | null>(null);

  const getAuthHeader = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    if (user && tripId) {
      fetchData();
    }
  }, [user, tripId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = { headers: getAuthHeader() };

      const [tripRes, expensesRes, settlementsRes, balancesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/trips/${tripId}`, config).catch(() => ({ data: null })),
        expensesApi.list(tripId).catch(() => ({ data: [] })),
        expensesApi.getSettlements(tripId).catch(() => ({ data: [] })),
        expensesApi.getBalances(tripId).catch(() => ({ data: [] })),
      ]);

      if (tripRes.data?.members) {
        setTripMembers(tripRes.data.members);
      }
      setExpenses(expensesRes.data || []);
      setSettlements(settlementsRes.data || []);
      setBalances(balancesRes.data || []);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = (mode: 'EXPENSE' | 'LEND_BORROW' | 'SETTLEMENT' = 'EXPENSE', prefillToUser?: string) => {
    resetForm();
    setIsEditing(false);
    setEditingExpenseId(null);
    setCategory(mode);
    if (user?.id) setPayerId(user.id);
    if (prefillToUser) setBorrowerId(prefillToUser);
    setSelectedParticipantIds(tripMembers.map((m: any) => m.userId || m.id));
    setIsModalOpen(true);
  };

  const openEditModal = (expense: Expense) => {
    resetForm();
    setIsEditing(true);
    setEditingExpenseId(expense.id);
    setCategory(expense.category || 'EXPENSE');
    setDescription(expense.description);
    setAmount((expense.amount / 100).toString());
    setCurrency(expense.currency || 'INR');
    setPayerId(expense.payerId || expense.payer?.id || user?.id || '');

    if (expense.category === 'LEND_BORROW' || expense.category === 'SETTLEMENT') {
      const otherSplit = expense.splits.find((s) => s.userId !== expense.payerId);
      if (otherSplit) {
        setBorrowerId(otherSplit.userId);
      }
    } else {
      const splits = expense.splits || [];
      const participantIds = splits.map((s) => s.userId);
      setSelectedParticipantIds(participantIds);

      const isEq = splits.length > 0 && splits.every((s) => Math.abs(s.amount - splits[0].amount) <= 1);
      setSplitType(isEq ? 'equal' : 'custom');

      const splitObj: Record<string, string> = {};
      splits.forEach((s) => {
        splitObj[s.userId] = (s.amount / 100).toString();
      });
      setCustomSplits(splitObj);
    }

    setIsModalOpen(true);
  };

  const openHistoryModal = async (expense: Expense) => {
    setSelectedExpenseForHistory(expense);
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const res = await expensesApi.getHistory(tripId, expense.id);
      setHistoryLogs(res.data || []);
    } catch (err) {
      console.error('Failed to load history logs:', err);
      setHistoryLogs([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const parsedAmount = Math.round(parseFloat(amount) * 100);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setErrorMessage('Please enter a valid amount.');
        return;
      }

      let activeParticipants = tripMembers.filter((m: any) => selectedParticipantIds.includes(m.userId || m.id));
      if (activeParticipants.length === 0) {
        activeParticipants = tripMembers.length > 0 ? tripMembers : [{ userId: user?.id || 'current_user' }];
      }

      let splits: ExpenseSplit[] = [];

      if (category === 'LEND_BORROW' || category === 'SETTLEMENT') {
        const targetBorrower = borrowerId || (tripMembers.find((m: any) => (m.userId || m.id) !== payerId)?.userId || payerId);
        splits = [
          {
            userId: targetBorrower,
            amount: parsedAmount,
          },
        ];
      } else if (splitType === 'equal') {
        const splitAmount = Math.round(parsedAmount / activeParticipants.length);
        const remainder = parsedAmount - splitAmount * activeParticipants.length;

        splits = activeParticipants.map((m: any, idx: number) => ({
          userId: m.userId || m.id,
          amount: idx === 0 ? splitAmount + remainder : splitAmount,
        }));
      } else {
        splits = activeParticipants.map((m: any) => {
          const uid = m.userId || m.id;
          const userVal = parseFloat(customSplits[uid] || '0');
          return {
            userId: uid,
            amount: Math.round(userVal * 100),
          };
        });

        const customTotal = splits.reduce((sum, s) => sum + s.amount, 0);
        if (customTotal !== parsedAmount) {
          setErrorMessage(`Custom split sum (${(customTotal / 100).toFixed(2)}) must equal total amount (${(parsedAmount / 100).toFixed(2)})`);
          return;
        }
      }

      const payload = {
        description: description.trim(),
        amount: parsedAmount,
        currency,
        category,
        payerId: payerId || user?.id,
        splits,
        ...(isEditing && changeReason ? { changeReason: changeReason.trim() } : {}),
      };

      if (isEditing && editingExpenseId) {
        await expensesApi.update(tripId, editingExpenseId, payload);
      } else {
        await expensesApi.create(tripId, payload);
      }

      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this transaction? All balances will be recalculated automatically.')) return;
    try {
      await expensesApi.delete(tripId, expenseId);
      fetchData();
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setCurrency('INR');
    setCategory('EXPENSE');
    setPayerId(user?.id || '');
    setBorrowerId('');
    setSelectedParticipantIds(tripMembers.map((m: any) => m.userId || m.id));
    setSplitType('equal');
    setCustomSplits({});
    setChangeReason('');
    setErrorMessage('');
  };

  // Summary Metrics
  const primaryCurrency = expenses.length > 0 ? (expenses[0].currency || 'INR') : 'INR';
  const totalTripSpend = expenses
    .filter((e) => e.category !== 'SETTLEMENT')
    .reduce((acc: number, curr: Expense) => acc + curr.amount, 0);

  let userOwedToYou = 0;
  let userYouOwe = 0;

  for (const b of balances) {
    if (b.toUserId === user?.id) {
      userOwedToYou += b.amount;
    }
    if (b.fromUserId === user?.id) {
      userYouOwe += b.amount;
    }
  }

  const netUserBalance = userOwedToYou - userYouOwe;

  return (
    <PageShell
      title="Trip Expenses & Record Book"
      subtitle="Easily track shared costs, 1-on-1 money owed or borrowed, and simplified group settlements."
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Trip Overview', href: `/trips/${tripId}` },
        { label: 'Expenses' },
      ]}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => openAddModal('LEND_BORROW')}
            variant="outline"
            className="border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40 shadow-sm"
          >
            <ArrowRightLeft className="h-4 w-4 mr-1.5" />
            Record Loan / Borrow
          </Button>
          <Button onClick={() => openAddModal('EXPENSE')} className="shadow-md shadow-emerald-600/20">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Expense
          </Button>
        </div>
      }
    >
      {/* Streamlined Metrics Summary */}
      <div className="mb-8 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <StatCard
          label="Total Trip Spend"
          value={formatCurrency(totalTripSpend, primaryCurrency)}
          subtext={`${expenses.length} transaction${expenses.length === 1 ? '' : 's'} recorded`}
          icon={<span className="font-bold text-sm">{getCurrencySymbol(primaryCurrency)}</span>}
          variant="indigo"
        />
        <StatCard
          label="Your Balance"
          value={
            netUserBalance > 0
              ? `+${formatCurrency(netUserBalance, primaryCurrency)}`
              : netUserBalance < 0
              ? `-${formatCurrency(Math.abs(netUserBalance), primaryCurrency)}`
              : '₹0.00'
          }
          subtext={
            netUserBalance > 0
              ? 'You are owed by friends'
              : netUserBalance < 0
              ? 'You owe friends money'
              : 'All your debts are balanced'
          }
          icon={
            netUserBalance > 0 ? (
              <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
            ) : netUserBalance < 0 ? (
              <ArrowUpRight className="h-4 w-4 text-amber-500" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            )
          }
          variant={netUserBalance > 0 ? 'success' : netUserBalance < 0 ? 'warning' : 'default'}
        />
        <StatCard
          label="Settlements Needed"
          value={settlements.length}
          subtext={settlements.length === 0 ? 'All debts cleared' : 'Direct payments to settle all'}
          icon={<ArrowRightLeft className="h-4 w-4" />}
          variant={settlements.length === 0 ? 'success' : 'warning'}
        />
      </div>

      {/* Segmented Navigation Switcher */}
      <div className="mb-6 flex overflow-x-auto scrollbar-none rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800/80 w-full sm:w-fit gap-1">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'expenses'
              ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-400'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Receipt className="h-3.5 w-3.5" />
          Transactions ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('recordbook')}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'recordbook'
              ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-400'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          Who Owes Who ({balances.length})
        </button>
        <button
          onClick={() => setActiveTab('settlements')}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'settlements'
              ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-400'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          Simplified Settlements ({settlements.length})
        </button>
      </div>

      {/* VIEW 1: TRANSACTIONS LEDGER */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {loading ? (
            <div className="trip-glass-card rounded-2xl p-8 text-center animate-pulse">
              <p className="text-sm text-slate-500">Loading transactions...</p>
            </div>
          ) : expenses.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-8 w-8" />}
              title="No transactions recorded yet"
              description="Record group bills, meal costs, or personal loans so debts and splits are tracked automatically."
              actionLabel="Add First Expense"
              onAction={() => openAddModal('EXPENSE')}
            />
          ) : (
            <div className="space-y-3">
              {expenses.map((expense: Expense) => (
                <div
                  key={expense.id}
                  className="trip-glass-card rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-bold text-base shadow-inner ${
                      expense.category === 'LEND_BORROW'
                        ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300'
                        : expense.category === 'SETTLEMENT'
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}>
                      {expense.category === 'LEND_BORROW' ? '🤝' : expense.category === 'SETTLEMENT' ? '💸' : getCurrencySymbol(expense.currency || 'INR')}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          {expense.description}
                        </h4>
                        {expense.category === 'LEND_BORROW' && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 text-[11px]">
                            Loan / Borrow
                          </Badge>
                        )}
                        {expense.category === 'SETTLEMENT' && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 text-[11px]">
                            Repayment
                          </Badge>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>Paid by <strong className="text-slate-700 dark:text-slate-200">{expense.payer?.name || expense.payer?.email || 'Member'}</strong></span>
                        
                        {expense.addedBy && expense.addedBy.id !== expense.payerId && (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md font-medium border border-indigo-100 dark:border-indigo-900/40">
                            <UserCheck className="h-3 w-3" />
                            Added by {expense.addedBy.name || expense.addedBy.email || 'Admin'}
                          </span>
                        )}

                        <span>•</span>
                        <span>{formatDate(expense.createdAt)}</span>
                        <span>•</span>
                        
                        {expense.category === 'EXPENSE' ? (
                          <span className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium">
                            For: {expense.splits?.length === tripMembers.length && tripMembers.length > 0
                              ? `All ${tripMembers.length} members`
                              : `${expense.splits?.map((s) => s.user?.name || s.user?.email?.split('@')[0] || 'Member').join(', ')} (${expense.splits?.length || 1})`}
                          </span>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            {expense.splits?.length || 1} participant
                          </Badge>
                        )}

                        {(expense.editCount || 0) > 1 && (
                          <button
                            onClick={() => openHistoryModal(expense)}
                            className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 font-semibold text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 transition text-[11px]"
                            title="View edit history"
                          >
                            <Clock className="h-3 w-3" />
                            Edited ({expense.editCount}x)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="text-right">
                      <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {formatCurrency(expense.amount, expense.currency || 'INR')}
                      </p>
                      <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {expense.currency || 'INR'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openHistoryModal(expense)}
                        className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
                        title="View edit history"
                      >
                        <History className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => openEditModal(expense)}
                        className="rounded-xl p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400 transition"
                        title="Edit transaction"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 transition"
                        title="Delete transaction"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: RECORD BOOK (WHO OWES WHO) */}
      {activeTab === 'recordbook' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                  Who Owes Who (Record Book)
                </CardTitle>
                <CardDescription>
                  Direct summary of all outstanding money between members. Click "Settle Up" when someone pays back.
                </CardDescription>
              </div>
              <Button
                onClick={() => openAddModal('LEND_BORROW')}
                variant="default"
                className="shrink-0"
              >
                Record Loan / Borrow
              </Button>
            </CardHeader>
            <CardContent>
              {balances.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-8 text-center dark:border-emerald-900/50 dark:bg-emerald-950/20">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                  <p className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                    All balances are settled!
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    No member owes any money to another member right now.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {balances.map((bal, idx) => {
                    const fromIsYou = bal.fromUserId === user?.id;
                    const toIsYou = bal.toUserId === user?.id;

                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl border p-4 shadow-sm transition-all flex flex-col justify-between gap-3 ${
                          toIsYou
                            ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                            : fromIsYou
                            ? 'border-amber-200 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20'
                            : 'border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-900/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                              <span>{fromIsYou ? 'You' : bal.fromUser?.name || bal.fromUser?.email || 'Member'}</span>
                              <span className="text-xs font-semibold text-rose-500 dark:text-rose-400">owes</span>
                              <span>{toIsYou ? 'You' : bal.toUser?.name || bal.toUser?.email || 'Member'}</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {toIsYou
                                ? 'They should pay you back'
                                : fromIsYou
                                ? 'You should pay them back'
                                : 'Direct split balance'}
                            </p>
                          </div>

                          <span className={`text-lg font-extrabold ${
                            toIsYou
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : fromIsYou
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-900 dark:text-white'
                          }`}>
                            {formatCurrency(bal.amount, primaryCurrency)}
                          </span>
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t pt-2 border-slate-100 dark:border-slate-800/80">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              openAddModal('SETTLEMENT', toIsYou ? bal.fromUserId : bal.toUserId);
                            }}
                            className="text-xs h-7 py-1 px-2.5"
                          >
                            💸 Settle Up
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* VIEW 3: SIMPLIFIED SETTLEMENTS */}
      {activeTab === 'settlements' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Simplified Settlements</CardTitle>
              <CardDescription>
                TripOS calculates the minimal number of payments to clear all debts across the group with zero circular transfers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {settlements.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-8 text-center dark:border-emerald-900/50 dark:bg-emerald-950/20">
                  <span className="text-3xl">🎉</span>
                  <p className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                    All balances are currently settled!
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    No one owes anyone money for this trip.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {settlements.map((settlement: Settlement, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-5 shadow-sm dark:border-indigo-900/50 dark:bg-indigo-950/30 flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                          <span>{settlement.fromName || settlement.from}</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">→ pays →</span>
                          <span>{settlement.toName || settlement.to}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Direct payment settlement
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-extrabold text-indigo-700 dark:text-indigo-300">
                          {formatCurrency(settlement.amount, primaryCurrency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ADD / EDIT TRANSACTION MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={
          isEditing
            ? 'Edit Transaction'
            : category === 'LEND_BORROW'
            ? 'Record Loan / Borrow'
            : category === 'SETTLEMENT'
            ? 'Record Debt Settle Up'
            : 'Add Group Expense'
        }
        description={
          isEditing
            ? 'Update transaction details. Any changes will be logged in the version history.'
            : category === 'LEND_BORROW'
            ? 'Record money lent or borrowed directly between two people.'
            : category === 'SETTLEMENT'
            ? 'Record a payment made to settle an outstanding balance.'
            : 'Log a shared expense and choose how it is divided among members.'
        }
        maxWidth="lg"
      >
        <form onSubmit={handleSaveExpense} className="space-y-4 mt-2">
          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200">
              {errorMessage}
            </div>
          )}

          {!isEditing && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                What are you recording?
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCategory('EXPENSE')}
                  className={`rounded-xl border p-2.5 text-center text-xs font-semibold transition ${
                    category === 'EXPENSE'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  💳 Group Expense
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('LEND_BORROW')}
                  className={`rounded-xl border p-2.5 text-center text-xs font-semibold transition ${
                    category === 'LEND_BORROW'
                      ? 'border-purple-600 bg-purple-50 text-purple-900 dark:bg-purple-950/50 dark:text-purple-200 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  🤝 Loan / Borrow
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('SETTLEMENT')}
                  className={`rounded-xl border p-2.5 text-center text-xs font-semibold transition ${
                    category === 'SETTLEMENT'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  💸 Settle Up
                </button>
              </div>
            </div>
          )}

          <Input
            label="Description *"
            placeholder={
              category === 'LEND_BORROW'
                ? 'e.g. Lent cash for scooter fuel ⛽'
                : category === 'SETTLEMENT'
                ? 'e.g. Settled up restaurant share via UPI 📲'
                : 'e.g. Seafood Dinner at Sunset Beach 🦞'
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            icon={<Receipt className="h-4 w-4" />}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              type="number"
              step="0.01"
              min="0.01"
              label="Amount *"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              icon={<span className="font-bold text-xs text-slate-500 dark:text-slate-400">{getCurrencySymbol(currency)}</span>}
              required
            />

            <Select
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="INR">INR (₹) - Indian Rupee</option>
              <option value="USD">USD ($) - US Dollar</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="GBP">GBP (£) - British Pound</option>
              <option value="AED">AED (د.إ) - UAE Dirham</option>
              <option value="SGD">SGD (S$) - Singapore Dollar</option>
              <option value="CAD">CAD (C$) - Canadian Dollar</option>
              <option value="AUD">AUD (A$) - Australian Dollar</option>
              <option value="JPY">JPY (¥) - Japanese Yen</option>
            </Select>
          </div>

          {/* Admin / Member info note */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-[11px] text-indigo-700 dark:text-indigo-300">
            <Users className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <span>Admins, owners, or any trip member can record spends paid by any member or on behalf of others.</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label={category === 'LEND_BORROW' ? 'Lender (Who Paid) *' : 'Paid By (Who Paid) *'}
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
            >
              {tripMembers.map((m: any) => {
                const uid = m.userId || m.id;
                const name = m.user?.name || m.user?.email || m.name || m.email || (uid === user?.id ? 'You' : `Member ${uid.slice(-4)}`);
                return (
                  <option key={uid} value={uid}>
                    {name} {uid === user?.id ? '(You)' : ''}
                  </option>
                );
              })}
            </Select>

            {(category === 'LEND_BORROW' || category === 'SETTLEMENT') && (
              <Select
                label={category === 'LEND_BORROW' ? 'Borrower (Who Received) *' : 'Paid To (Recipient) *'}
                value={borrowerId}
                onChange={(e) => setBorrowerId(e.target.value)}
              >
                <option value="">Select Member...</option>
                {tripMembers
                  .filter((m: any) => (m.userId || m.id) !== payerId)
                  .map((m: any) => {
                    const uid = m.userId || m.id;
                    const name = m.user?.name || m.user?.email || m.name || m.email || (uid === user?.id ? 'You' : `Member ${uid.slice(-4)}`);
                    return (
                      <option key={uid} value={uid}>
                        {name} {uid === user?.id ? '(You)' : ''}
                      </option>
                    );
                  })}
              </Select>
            )}
          </div>

          {category === 'EXPENSE' && (
            <div className="space-y-3 pt-2">
              {/* Participant Selection ("Who was this for?") */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Who Was This For? ({selectedParticipantIds.length} selected)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedParticipantIds(tripMembers.map((m: any) => m.userId || m.id))}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (tripMembers.length > 0) {
                          setSelectedParticipantIds([payerId || tripMembers[0].userId || tripMembers[0].id]);
                        }
                      }}
                      className="text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400"
                    >
                      Only Payer
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {tripMembers.map((m: any) => {
                    const uid = m.userId || m.id;
                    const name = m.user?.name || m.user?.email || m.name || m.email || (uid === user?.id ? 'You' : `Member ${uid.slice(-4)}`);
                    const isSelected = selectedParticipantIds.includes(uid);
                    return (
                      <button
                        key={uid}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (selectedParticipantIds.length > 1) {
                              setSelectedParticipantIds(selectedParticipantIds.filter((id) => id !== uid));
                            }
                          } else {
                            setSelectedParticipantIds([...selectedParticipantIds, uid]);
                          }
                        }}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium transition text-left ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200'
                            : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className={`h-4 w-4 rounded flex items-center justify-center border ${
                          isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-700'
                        }`}>
                          {isSelected && <CheckCircle2 className="h-3 w-3" />}
                        </div>
                        <span className="truncate">{name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Split Method */}
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 pt-1">
                Split Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSplitType('equal')}
                  className={`rounded-xl border p-3 text-left transition ${
                    splitType === 'equal'
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-semibold'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
                  }`}
                >
                  <div className="text-sm font-semibold">Equal Split</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {amount && !isNaN(parseFloat(amount)) && selectedParticipantIds.length > 0
                      ? `Each pays ${getCurrencySymbol(currency)}${(parseFloat(amount) / selectedParticipantIds.length).toFixed(2)} (${selectedParticipantIds.length} member${selectedParticipantIds.length === 1 ? '' : 's'})`
                      : 'Divide evenly among selected members'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSplitType('custom')}
                  className={`rounded-xl border p-3 text-left transition ${
                    splitType === 'custom'
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-semibold'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
                  }`}
                >
                  <div className="text-sm font-semibold">Custom Split</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Specify exact amounts per selected member</div>
                </button>
              </div>

              {splitType === 'custom' && (
                <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Enter individual share for selected members ({getCurrencySymbol(currency)}):
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {tripMembers
                      .filter((m: any) => selectedParticipantIds.includes(m.userId || m.id))
                      .map((m: any) => {
                        const uid = m.userId || m.id;
                        const name = m.user?.name || m.user?.email || m.name || m.email || (uid === user?.id ? 'You' : `Member ${uid.slice(-4)}`);
                        return (
                          <div key={uid} className="flex items-center justify-between gap-2">
                            <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[120px]">{name}</span>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={customSplits[uid] || ''}
                              onChange={(e) => setCustomSplits({ ...customSplits, [uid]: e.target.value })}
                              className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {isEditing && (
            <Input
              label="Reason for Change (Optional)"
              placeholder="e.g. Corrected tip amount / fixed typo"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              icon={<History className="h-4 w-4" />}
            />
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              isLoading={isSubmitting}
            >
              {isEditing ? 'Save Changes' : 'Record Transaction'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* AUDIT LOG HISTORY MODAL */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setSelectedExpenseForHistory(null);
          setHistoryLogs([]);
        }}
        title="Transaction Audit History"
        description={`Version log for "${selectedExpenseForHistory?.description || 'Transaction'}"`}
        maxWidth="lg"
      >
        <div className="space-y-4 mt-2">
          {historyLoading ? (
            <div className="p-8 text-center animate-pulse text-sm text-slate-500">
              Loading audit history...
            </div>
          ) : historyLogs.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              No audit records found for this transaction.
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {historyLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {log.user?.name ? log.user.name[0].toUpperCase() : <User className="h-3.5 w-3.5" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {log.user?.name || log.user?.email || 'Trip Member'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatDate(log.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={log.action === 'CREATED' ? 'success' : 'secondary'}>
                      {log.action}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {log.details}
                  </p>

                  {log.changes && Object.keys(log.changes).length > 0 && (
                    <div className="mt-2 rounded-xl bg-white p-2.5 text-[11px] font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {Object.entries(log.changes).map(([field, diff]: [string, any]) => {
                        let displayValue = '';
                        if (typeof diff === 'object' && diff !== null) {
                          if (diff.from !== undefined && diff.to !== undefined) {
                            const formatVal = (v: any) => {
                              if (typeof v === 'number' && v > 100) return `${(v / 100).toFixed(2)}`;
                              return v;
                            };
                            displayValue = `${formatVal(diff.from)} → ${formatVal(diff.to)}`;
                          } else {
                            displayValue = JSON.stringify(diff);
                          }
                        } else {
                          displayValue = String(diff);
                        }

                        return (
                          <div key={field} className="flex justify-between py-0.5">
                            <span className="font-semibold capitalize text-slate-500">{field}:</span>
                            <span>{displayValue}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsHistoryModalOpen(false);
                setSelectedExpenseForHistory(null);
              }}
            >
              Close History
            </Button>
          </div>
        </div>
      </Modal>
    </PageShell>
  );
}
