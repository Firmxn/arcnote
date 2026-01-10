/**
 * Finance Store (Zustand)
 * State management untuk Finance Transactions
 */

import { create } from 'zustand';
import type { FinanceTransaction, CreateTransactionInput, UpdateTransactionInput, FinanceSummary } from '../types/finance';
import { financeRepository } from '../data/finance.repository';

interface FinanceState {
    transactions: FinanceTransaction[];
    summary: FinanceSummary | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    loadTransactions: () => Promise<void>;
    loadSummary: () => Promise<void>;
    createTransaction: (input: CreateTransactionInput) => Promise<FinanceTransaction>;
    updateTransaction: (id: string, input: UpdateTransactionInput) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    markTransactionAsVisited: (id: string) => Promise<void>;
    filterByType: (type: 'income' | 'expense' | 'all') => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set) => ({
    transactions: [],
    summary: null,
    isLoading: false,
    error: null,

    loadTransactions: async () => {
        set({ isLoading: true, error: null });
        try {
            const transactions = await financeRepository.getAll();
            set({ transactions, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to load transactions', isLoading: false });
        }
    },

    loadSummary: async () => {
        try {
            const summary = await financeRepository.getSummary();
            set({ summary });
        } catch (error) {
            set({ error: 'Failed to load summary' });
        }
    },

    createTransaction: async (input: CreateTransactionInput) => {
        try {
            const newTransaction = await financeRepository.create(input);
            set((state) => ({
                transactions: [newTransaction, ...state.transactions].sort((a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
            }));
            // Reload summary
            const summary = await financeRepository.getSummary();
            set({ summary });
            return newTransaction;
        } catch (error) {
            set({ error: 'Failed to create transaction' });
            throw error;
        }
    },

    updateTransaction: async (id: string, input: UpdateTransactionInput) => {
        try {
            await financeRepository.update(id, input);
            const updatedTransactions = await financeRepository.getAll();
            const summary = await financeRepository.getSummary();
            set({ transactions: updatedTransactions, summary });
        } catch (error) {
            set({ error: 'Failed to update transaction' });
        }
    },

    deleteTransaction: async (id: string) => {
        try {
            await financeRepository.delete(id);
            set((state) => ({
                transactions: state.transactions.filter(t => t.id !== id)
            }));
            // Reload summary
            const summary = await financeRepository.getSummary();
            set({ summary });
        } catch (error) {
            set({ error: 'Failed to delete transaction' });
        }
    },

    markTransactionAsVisited: async (id: string) => {
        try {
            await financeRepository.markAsVisited(id);
            // Reload transactions untuk update lastVisitedAt di state
            const transactions = await financeRepository.getAll();
            set({ transactions });
        } catch (error) {
            console.error('Failed to mark transaction as visited:', error);
        }
    },

    filterByType: async (type: 'income' | 'expense' | 'all') => {
        set({ isLoading: true, error: null });
        try {
            let transactions: FinanceTransaction[];
            if (type === 'all') {
                transactions = await financeRepository.getAll();
            } else {
                transactions = await financeRepository.getByType(type);
            }
            set({ transactions, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to filter transactions', isLoading: false });
        }
    },
}));
