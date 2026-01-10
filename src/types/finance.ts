/**
 * Type definitions untuk Finance Tracker
 */

export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
    // Income categories
    | 'Salary'
    | 'Freelance'
    | 'Investment'
    | 'Gift'
    | 'Other Income'
    // Expense categories
    | 'Food & Dining'
    | 'Transportation'
    | 'Shopping'
    | 'Entertainment'
    | 'Bills & Utilities'
    | 'Healthcare'
    | 'Education'
    | 'Other Expense';

export interface FinanceTransaction {
    id: string;
    type: TransactionType;
    amount: number;
    category: TransactionCategory;
    description?: string;
    date: Date; // Tanggal transaksi
    createdAt: Date;
    updatedAt: Date;
    lastVisitedAt?: Date; // Untuk Recently Visited
}

export type CreateTransactionInput = Omit<FinanceTransaction, 'id' | 'createdAt' | 'updatedAt' | 'lastVisitedAt'>;
export type UpdateTransactionInput = Partial<CreateTransactionInput>;

export interface FinanceSummary {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    transactionCount: number;
}
