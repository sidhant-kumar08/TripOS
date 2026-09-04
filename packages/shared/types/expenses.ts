export interface Expense {
  id: string;
  tripId: string;
  payerId: string;
  description: string;
  amount: number;
  currency: string;
  createdAt: string;
}

export interface ExpenseSplit {
  userId: string;
  amount: number;
}

export interface CreateExpenseRequest {
  description: string;
  amount: number;
  currency?: string;
  splits: ExpenseSplit[];
}

export interface ExpenseBalance {
  fromUserId: string;
  toUserId: string;
  amount: number; // positive means from owes to
}
