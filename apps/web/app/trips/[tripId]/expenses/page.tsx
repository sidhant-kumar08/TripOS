'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/runtime-config';
import { PageShell } from '@/components/ui/page-shell';
import { Card } from '@/components/ui/controls';

interface Expense {
  id: string;
  description: string;
  amount: number;
  payerId: string;
  payerName?: string;
  currency: string;
  splits: Array<{
    userId: string;
    amount: number;
  }>;
  createdAt: string;
}

interface Balance {
  fromUserId: string;
  toUserId: string;
  balance: number;
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
  const [balances, setBalances] = useState<Balance[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances'>('expenses');

  const [newExpDescription, setNewExpDescription] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');
  const [newExpCurrency, setNewExpCurrency] = useState('USD');
  const [newExpSplitType, setNewExpSplitType] = useState<'equal' | 'custom'>('equal');
  const [newExpSplits, setNewExpSplits] = useState<Array<{ member: string; amount: string }>>([]);

  const getAuthHeader = () => {
    const token = localStorage.getItem('accessToken');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, tripId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = { headers: getAuthHeader() };

      const [expensesRes, balancesRes, settlementsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/trips/${tripId}/expenses`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/expenses/balances/all?tripId=${tripId}`, config).catch(() => ({ data: [] })),
        axios
          .get(`${API_BASE_URL}/expenses/settlement/suggestions?tripId=${tripId}`, config)
          .catch(() => ({ data: [] })),
      ]);

      setExpenses(expensesRes.data);
      setBalances(balancesRes.data);
      setSettlements(settlementsRes.data);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpDescription.trim() || !newExpAmount) return;

    try {
      const amount = Math.round(parseFloat(newExpAmount) * 100); // Convert to cents

      const splits =
        newExpSplitType === 'equal'
          ? newExpSplits.map((s) => ({
              userId: s.member,
              amount: Math.round(amount / newExpSplits.length),
            }))
          : newExpSplits.map((s) => ({
              userId: s.member,
              amount: Math.round(parseFloat(s.amount) * 100),
            }));

      const config = { headers: getAuthHeader() };
      await axios.post(
        `${API_BASE_URL}/trips/${tripId}/expenses`,
        {
          description: newExpDescription,
          amount,
          currency: newExpCurrency,
          splits,
        },
        config,
      );

      setNewExpDescription('');
      setNewExpAmount('');
      setNewExpCurrency('USD');
      setNewExpSplitType('equal');
      setNewExpSplits([]);
      fetchData();
    } catch (error) {
      console.error('Failed to create expense:', error);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Delete this expense?')) return;
    try {
      const config = { headers: getAuthHeader() };
      await axios.delete(`${API_BASE_URL}/trips/${tripId}/expenses/${expenseId}`, config);
      fetchData();
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-600">Loading expenses...</div>;
  }

  return (
    <PageShell title="Trip Expenses" subtitle="Track expenses, balances, and settlement suggestions.">
      <div className="mb-8 flex gap-3 rounded-full border border-white/70 bg-white/70 p-2 shadow-sm backdrop-blur w-fit">
        <button onClick={() => setActiveTab('expenses')} className={`rounded-full px-5 py-2 text-sm font-semibold transition ${activeTab === 'expenses' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-600 hover:text-slate-900'}`}>
          Expenses
        </button>
        <button onClick={() => setActiveTab('balances')} className={`rounded-full px-5 py-2 text-sm font-semibold transition ${activeTab === 'balances' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-600 hover:text-slate-900'}`}>
          Balances & Settlements
        </button>
      </div>

      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <Card>
            <form onSubmit={handleCreateExpense}>
              <h2 className="text-lg font-semibold text-slate-900">Add Expense</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <input type="text" placeholder="Description" value={newExpDescription} onChange={(e) => setNewExpDescription(e.target.value)} className="trip-input md:col-span-2" required />
                <input type="number" placeholder="Amount" step="0.01" value={newExpAmount} onChange={(e) => setNewExpAmount(e.target.value)} className="trip-input" required />
                <select value={newExpCurrency} onChange={(e) => setNewExpCurrency(e.target.value)} className="trip-input">
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                </select>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Split Type</label>
                  <div className="flex gap-4">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"><input type="radio" value="equal" checked={newExpSplitType === 'equal'} onChange={(e) => setNewExpSplitType(e.target.value as any)} /> Equal Split</label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"><input type="radio" value="custom" checked={newExpSplitType === 'custom'} onChange={(e) => setNewExpSplitType(e.target.value as any)} /> Custom Split</label>
                  </div>
                </div>
              </div>
              <button type="submit" className="trip-button mt-5">Add Expense</button>
            </form>
          </Card>

          <div className="space-y-4">
            {expenses.length === 0 ? (
              <Card className="text-center text-slate-500">No expenses yet</Card>
            ) : (
              expenses.map((expense) => (
                <Card key={expense.id} className="trip-card-hover">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900">{expense.description}</h3>
                      <p className="mt-2 text-3xl font-semibold tracking-tight text-emerald-600">{(expense.amount / 100).toFixed(2)} {expense.currency}</p>
                      <p className="mt-2 text-sm text-slate-500">Paid by: {expense.payerName || 'Unknown'}</p>
                      <div className="mt-2 text-xs font-medium uppercase tracking-[0.15em] text-slate-400">{new Date(expense.createdAt).toLocaleDateString()}</div>
                    </div>
                    <button onClick={() => handleDeleteExpense(expense.id)} className="trip-button-secondary px-3 py-2 text-xs text-red-600 hover:text-red-700">Delete</button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'balances' && (
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Who Owes Whom</h2>
            {balances.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">All balances settled!</p>
            ) : (
              <div className="mt-4 space-y-3">
                {balances.map((balance, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <span><span className="font-semibold text-slate-900">{balance.fromUserId}</span> owes <span className="font-semibold text-slate-900">{balance.toUserId}</span></span>
                    <span className="font-semibold text-emerald-600">${(balance.balance / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Settlement Suggestions</h2>
            {settlements.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No settlements needed!</p>
            ) : (
              <div className="mt-4 space-y-3">
                {settlements.map((settlement, idx) => (
                  <div key={idx} className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4">
                    <p className="text-sm font-semibold text-slate-800">{settlement.from} pays {settlement.to}</p>
                    <p className="mt-1 text-2xl font-semibold text-blue-700">${(settlement.amount / 100).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </PageShell>
  );
}
