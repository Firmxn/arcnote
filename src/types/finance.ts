/**
 * Type definitions untuk Finance Tracker
 */

import type { Syncable } from './sync';

export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
    // Income categories
    | 'Salary'
    | 'Freelance'
    | 'Investment'
    | 'Gift'
    | 'Other Income'
    | 'Transfer In' // Transfer masuk dari wallet lain
    // Expense categories
    | 'Food & Dining'
    | 'Transportation'
    | 'Shopping'
    | 'Entertainment'
    | 'Bills & Utilities'
    | 'Healthcare'
    | 'Education'
    | 'Other Expense'
    | 'Transfer Out'; // Transfer keluar ke wallet lain


export interface Wallet extends Syncable {
    id: string;
    title: string;
    description?: string;
    currency: string;
    theme?: string; // Menyimpan warna hex/class
    isMain?: boolean; // Menandai wallet utama, hanya 1 per user
    createdAt: Date;
    updatedAt: Date;
    lastVisitedAt?: Date;
    isArchived?: boolean;
}

export interface FinanceTransaction extends Syncable {
    id: string;
    walletId: string; // Reference to Wallet
    type: TransactionType;
    amount: number;
    category: TransactionCategory;
    description?: string;
    attachments?: string[]; // Array of URLs/paths
    date: Date; // Tanggal transaksi
    createdAt: Date;
    updatedAt: Date;
    lastVisitedAt?: Date; // Untuk Recently Visited
    // Transfer-related fields
    linkedTransactionId?: string; // ID transaksi pasangan (untuk transfer)
    linkedWalletId?: string; // ID wallet tujuan/sumber (untuk transfer)
}

export type CreateWalletInput = Omit<Wallet, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateWalletInput = Partial<CreateWalletInput>;

export type CreateTransactionInput = Omit<FinanceTransaction, 'id' | 'createdAt' | 'updatedAt' | 'lastVisitedAt'>;
export type UpdateTransactionInput = Partial<CreateTransactionInput>;

export interface FinanceSummary {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    transactionCount: number;
}

/**
 * Budget Period type
 * Menentukan periode budget (mingguan, bulanan, atau tahunan)
 */
export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly';

/**
 * Budget interface
 * Virtual wallet untuk tracking pengeluaran terhadap target
 */
export interface Budget extends Syncable {
    id: string;
    title: string;
    description?: string;
    targetAmount: number; // Target pengeluaran dalam currency
    period: BudgetPeriod; // Periode budget
    categoryFilter?: TransactionCategory[]; // Optional: filter category untuk auto-assignment
    createdAt: Date;
    updatedAt: Date;
    isArchived?: boolean;
}

/**
 * Budget Assignment
 * Junction table untuk link transaction ke budget
 */
export interface BudgetAssignment extends Syncable {
    id: string;
    budgetId: string;
    transactionId: string;
    createdAt: Date;
}

/**
 * Budget Summary
 * Summary untuk dashboard dan budget detail
 */
export interface BudgetSummary {
    budget: Budget;
    totalSpent: number; // Total amount dari assigned transactions
    transactionCount: number; // Jumlah transactions yang di-assign
    percentageUsed: number; // Percentage spent vs target (0-100+)
    remainingAmount: number; // Target - spent (bisa negative jika over budget)
    isOverBudget: boolean; // True jika spent > target
}

// Helper types untuk CRUD operations
export type CreateBudgetInput = Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateBudgetInput = Partial<CreateBudgetInput>;
