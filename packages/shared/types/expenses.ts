/**
 * Represents an expense transaction within a trip ledger.
 * Note: `amount` is stored in minor integer units (cents/paise) to prevent floating-point drift.
 */
export interface Expense {
  id: string;
  tripId: string;
  payerId: string;
  description: string;
  amount: number; // Minor units (e.g. 1050 = $10.50 / ₹10.50)
  currency: string;
  createdAt: string;
}

/**
 * Individual member share of an expense.
 */
export interface ExpenseSplit {
  userId: string;
  amount: number; // Minor units
}

export interface CreateExpenseRequest {
  description: string;
  amount: number; // Minor units
  currency?: string;
  splits: ExpenseSplit[];
}

/**
 * Pairwise net debt between two users (fromUserId owes toUserId).
 */
export interface ExpenseBalance {
  fromUserId: string;
  toUserId: string;
  amount: number; // Minor units (positive = from owes to)
}

