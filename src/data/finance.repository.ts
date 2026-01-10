/**
 * Finance Repository
 * Data access layer untuk Finance Transactions
 */

import { db } from './db';
import type { FinanceTransaction, CreateTransactionInput, UpdateTransactionInput, FinanceSummary } from '../types/finance';
import { nanoid } from 'nanoid';

export const financeRepository = {
    /**
     * Mengambil semua transaksi (sorted by date descending)
     */
    async getAll(): Promise<FinanceTransaction[]> {
        return await db.finance.orderBy('date').reverse().toArray();
    },

    /**
     * Mengambil transaksi berdasarkan ID
     */
    async getById(id: string): Promise<FinanceTransaction | undefined> {
        return await db.finance.get(id);
    },

    /**
     * Mengambil transaksi berdasarkan type (income/expense)
     */
    async getByType(type: 'income' | 'expense'): Promise<FinanceTransaction[]> {
        return await db.finance.where('type').equals(type).reverse().sortBy('date');
    },

    /**
     * Mengambil transaksi berdasarkan category
     */
    async getByCategory(category: string): Promise<FinanceTransaction[]> {
        return await db.finance.where('category').equals(category).reverse().sortBy('date');
    },

    /**
     * Membuat transaksi baru
     */
    async create(input: CreateTransactionInput): Promise<FinanceTransaction> {
        const now = new Date();
        const transaction: FinanceTransaction = {
            id: nanoid(),
            ...input,
            createdAt: now,
            updatedAt: now,
        };
        await db.finance.add(transaction);
        return transaction;
    },

    /**
     * Update transaksi
     */
    async update(id: string, input: UpdateTransactionInput): Promise<FinanceTransaction | undefined> {
        const transaction = await db.finance.get(id);
        if (!transaction) return undefined;

        const updated: FinanceTransaction = {
            ...transaction,
            ...input,
            updatedAt: new Date(),
        };

        await db.finance.update(id, updated);
        return updated;
    },

    /**
     * Hapus transaksi
     */
    async delete(id: string): Promise<void> {
        await db.finance.delete(id);
    },

    /**
     * Mark transaksi sebagai visited (untuk Recently Visited)
     */
    async markAsVisited(id: string): Promise<void> {
        await db.finance.update(id, {
            lastVisitedAt: new Date(),
        });
    },

    /**
     * Hitung summary (total income, expense, balance)
     */
    async getSummary(): Promise<FinanceSummary> {
        const transactions = await db.finance.toArray();

        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            transactionCount: transactions.length,
        };
    },

    /**
     * Hitung summary berdasarkan range tanggal
     */
    async getSummaryByDateRange(startDate: Date, endDate: Date): Promise<FinanceSummary> {
        const transactions = await db.finance
            .where('date')
            .between(startDate, endDate, true, true)
            .toArray();

        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            transactionCount: transactions.length,
        };
    },
};
