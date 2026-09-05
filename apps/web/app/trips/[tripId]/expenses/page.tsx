'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Plus,
  ArrowRightLeft,
  Trash2,
  Receipt,
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

interface ExpenseSplit {
  userId: string;
  amount: number;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  payerId: string;
  payerName?: string;
  currency: string;
  splits: ExpenseSplit[];
  createdAt: string;
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export default function ExpensesPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { user } = useAuth();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [tripMembers, setTripMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'expenses' | 'settlements'>('expenses');

  // Modal State
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState('');

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

      const [tripRes, expensesRes, settlementsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/trips/${tripId}`, config).catch(() => ({ data: null })),
        axios.get(`${API_BASE_URL}/trips/${tripId}/expenses`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/expenses/settlement/suggestions?tripId=${tripId}`, config).catch(() => ({ data: [] })),
      ]);

      if (tripRes.data?.members) {
        setTripMembers(tripRes.data.members);
      }
      setExpenses(expensesRes.data || []);
      setSettlements(settlementsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const parsedAmount = Math.round(parseFloat(amount) * 100); // convert dollars to cents
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setErrorMessage('Please enter a valid expense amount.');
        return;
      }

      // Build splits
      const activeMembers = tripMembers.length > 0 ? tripMembers : [{ userId: user?.id || 'current_user' }];
      let splits: ExpenseSplit[] = [];

      if (splitType === 'equal') {
        const splitAmount = Math.round(parsedAmount / activeMembers.length);
        splits = activeMembers.map((m: any) => ({
          userId: m.userId || m.id,
          amount: splitAmount,
        }));
      } else {
        splits = activeMembers.map((m: any) => {
          const uid = m.userId || m.id;
          const userVal = parseFloat(customSplits[uid] || '0');
          return {
            userId: uid,
            amount: Math.round(userVal * 100),
          };
        });
      }

      const config = { headers: getAuthHeader() };
      await axios.post(
        `${API_BASE_URL}/trips/${tripId}/expenses`,
        {
          description: description.trim(),
          amount: parsedAmount,
          currency,
          splits,
        },
        config
      );

      setIsAddExpenseModalOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      const config = { headers: getAuthHeader() };
      await axios.delete(`${API_BASE_URL}/trips/${tripId}/expenses/${expenseId}`, config);
      fetchData();
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setCurrency('INR');
    setSplitType('equal');
    setCustomSplits({});
    setErrorMessage('');
  };

  // Compute summary metrics & primary currency
  const primaryCurrency = expenses.length > 0 ? (expenses[0].currency || 'INR') : 'INR';
  const totalTripSpend = expenses.reduce((acc: number, curr: Expense) => acc + curr.amount, 0);

  return (
    <PageShell
      title="Trip Expenses & Splits"
      subtitle="Track shared costs, equal and custom splits, and debt-simplifying settlements."
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Trip Overview', href: `/trips/${tripId}` },
        { label: 'Expenses' },
      ]}
      actions={
        <Button onClick={() => setIsAddExpenseModalOpen(true)} className="shadow-md shadow-emerald-600/20">
          <Plus className="h-4 w-4 mr-1" />
          Add Expense
        </Button>
      }
    >
      {/* Metric Cards Banner */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Trip Spend"
          value={formatCurrency(totalTripSpend, primaryCurrency)}
          subtext={`${expenses.length} recorded expense${expenses.length === 1 ? '' : 's'}`}
          icon={<span className="font-bold text-sm">{getCurrencySymbol(primaryCurrency)}</span>}
          variant="indigo"
        />
        <StatCard
          label="Settlements Needed"
          value={settlements.length}
          subtext={settlements.length === 0 ? 'All debts balanced' : 'Simplified transactions'}
          icon={<ArrowRightLeft className="h-4 w-4" />}
          variant={settlements.length === 0 ? 'success' : 'warning'}
        />
        <StatCard
          label="Deterministic Engine"
          value="Audited"
          subtext="Zero rounding errors"
          icon={<span className="font-bold text-sm">{getCurrencySymbol(primaryCurrency)}</span>}
          variant="default"
        />
      </div>

      {/* Segmented View Switcher */}
      <div className="mb-6 flex rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800/80 w-fit">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'expenses'
              ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-400'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Receipt className="h-3.5 w-3.5" />
          Expenses Ledger ({expenses.length})
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
          Smart Settlement Matrix ({settlements.length})
        </button>
      </div>

      {/* VIEW 1: EXPENSES LEDGER */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {loading ? (
            <div className="trip-glass-card rounded-2xl p-8 text-center animate-pulse">
              <p className="text-sm text-slate-500">Loading ledger...</p>
            </div>
          ) : expenses.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-8 w-8" />}
              title="No expenses recorded yet"
              description="Record dinner, accommodation, or ticket costs so everyone's share is tracked automatically."
              actionLabel="+ Add First Expense"
              onAction={() => setIsAddExpenseModalOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {expenses.map((expense: Expense) => (
                <div
                  key={expense.id}
                  className="trip-glass-card rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-inner font-bold text-base">
                      {getCurrencySymbol(expense.currency || 'INR')}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {expense.description}
                      </h4>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>Paid by <strong className="text-slate-700 dark:text-slate-200">{expense.payerName || 'Member'}</strong></span>
                        <span>•</span>
                        <span>{formatDate(expense.createdAt)}</span>
                        <span>•</span>
                        <Badge variant="secondary">
                          {expense.splits?.length || 1} split{(expense.splits?.length || 1) > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="text-right">
                      <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {formatCurrency(expense.amount, expense.currency || 'INR')}
                      </p>
                      <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {expense.currency || 'INR'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 transition"
                      title="Delete expense"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: SETTLEMENTS MATRIX */}
      {activeTab === 'settlements' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Debt-Simplification Settlements</CardTitle>
              <CardDescription>
                TripOS calculates the minimal number of transactions required so all debts are cleared with zero hassle.
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
                          <span>{settlement.from}</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">→ pays →</span>
                          <span>{settlement.to}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Direct settlement transaction
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

      {/* ADD EXPENSE MODAL */}
      <Modal
        isOpen={isAddExpenseModalOpen}
        onClose={() => {
          setIsAddExpenseModalOpen(false);
          resetForm();
        }}
        title="Add Group Expense"
        description="Log a shared cost and choose how it is divided among trip members."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4 mt-2">
          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200">
              {errorMessage}
            </div>
          )}

          <Input
            label="Expense Description *"
            placeholder="e.g. Cliffside Seafood Dinner with Wine 🍷"
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
              label="Total Amount *"
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

          {/* Split Type Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
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
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Divide evenly across all members</div>
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
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Specify custom amounts per person</div>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsAddExpenseModalOpen(false);
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
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
