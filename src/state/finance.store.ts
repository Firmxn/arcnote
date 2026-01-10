/**
 * Finance Store (Zustand)
 * State management untuk Finance Transactions
 */

import { create } from 'zustand';
import type {
    FinanceTransaction,
    FinanceAccount,
    CreateTransactionInput,
    UpdateTransactionInput,
    CreateAccountInput,
    UpdateAccountInput,
    FinanceSummary
} from '../types/finance';
import { financeRepository, backendFinanceRepository } from '../data/finance.repository';

interface FinanceState {
    // Accounts State
    accounts: FinanceAccount[];
    currentAccount: FinanceAccount | null;

    // Transactions State (Active Account)
    transactions: FinanceTransaction[];
    summary: FinanceSummary | null;
    balances: Record<string, number>; // Balance cache for all accounts

    // UI State
    isLoading: boolean;
    error: string | null;

    // Account Actions
    loadAccounts: () => Promise<void>;
    loadBalances: () => Promise<void>; // Load balances for all loaded accounts
    createAccount: (input: CreateAccountInput) => Promise<FinanceAccount>;
    updateAccount: (id: string, input: UpdateAccountInput) => Promise<void>;
    selectAccount: (accountId: string) => Promise<void>;
    deleteAccount: (id: string) => Promise<void>;
    markAccountAsVisited: (id: string) => Promise<void>;

    // Transaction Actions
    loadTransactions: () => Promise<void>;
    loadSummary: () => Promise<void>;
    createTransaction: (input: CreateTransactionInput) => Promise<void>;
    updateTransaction: (id: string, input: UpdateTransactionInput) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    markTransactionAsVisited: (id: string) => Promise<void>;
    filterByType: (type: 'income' | 'expense' | 'all') => void;
    syncAccountToCloud: (id: string) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
    accounts: [],
    currentAccount: null,
    transactions: [],
    summary: {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        transactionCount: 0,
    },
    balances: {},
    isLoading: false,
    error: null,

    // --- Account Actions ---

    loadAccounts: async () => {
        set({ isLoading: true, error: null });
        try {
            const accounts = await financeRepository.getAllAccounts();
            set({ accounts, isLoading: false });

            // If no current account but accounts exist, select the first one (usually 'default') if logic permits
            // But we prefer explicit selection or based on URL.
        } catch (error) {
            set({ error: 'Failed to load accounts', isLoading: false });
        }
    },

    loadBalances: async () => {
        const { accounts } = get();
        const balances: Record<string, number> = {};

        try {
            await Promise.all(accounts.map(async (acc) => {
                const summary = await financeRepository.getSummary(acc.id);
                balances[acc.id] = summary.balance;
            }));
            set({ balances });
        } catch (error) {
            console.error('Failed to load balances', error);
        }
    },

    createAccount: async (input: CreateAccountInput) => {
        try {
            const newAccount = await financeRepository.createAccount(input);
            set((state) => ({
                accounts: [...state.accounts, newAccount]
            }));
            return newAccount;
        } catch (error) {
            set({ error: 'Failed to create account' });
            throw error;
        }
    },

    updateAccount: async (id: string, input: UpdateAccountInput) => { // Type fix needed: UpdateAccountInput
        try {
            await financeRepository.updateAccount(id, input);
            const accounts = await financeRepository.getAllAccounts();
            set({ accounts });

            // Update current account if matched
            const { currentAccount } = get();
            if (currentAccount?.id === id) {
                const updated = accounts.find(a => a.id === id) || null;
                set({ currentAccount: updated });
            }
        } catch (error) {
            set({ error: 'Failed to update account' });
        }
    },

    selectAccount: async (accountId: string) => {
        const { accounts, loadTransactions, loadSummary } = get();
        // If accounts not loaded yet?
        let targetAccount = accounts.find(a => a.id === accountId);

        if (!targetAccount) {
            // Try fetch fresh
            const refreshedAccounts = await financeRepository.getAllAccounts(); // or getById
            targetAccount = refreshedAccounts.find(a => a.id === accountId);
            set({ accounts: refreshedAccounts });
        }

        if (targetAccount) {
            set({ currentAccount: targetAccount });
            // Load data for this account
            await loadTransactions();
            await loadSummary();
        }
    },

    deleteAccount: async (id: string) => {
        try {
            await financeRepository.deleteAccount(id);
            const accounts = await financeRepository.getAllAccounts();
            set({ accounts });
            if (get().currentAccount?.id === id) {
                set({ currentAccount: null });
            }
        } catch (error) {
            set({ error: 'Failed to delete account' });
        }
    },

    markAccountAsVisited: async (id: string) => {
        try {
            await financeRepository.markAccountAsVisited(id);
            set(state => ({
                accounts: state.accounts.map(acc =>
                    acc.id === id ? { ...acc, lastVisitedAt: new Date() } : acc
                )
            }));
        } catch (error) {
            console.error('Failed to mark account as visited', error);
        }
    },

    // --- Transaction Actions ---

    loadTransactions: async () => {
        const { currentAccount } = get();
        if (!currentAccount) return;

        set({ isLoading: true, error: null });
        try {
            const transactions = await financeRepository.getAll(currentAccount.id);
            // Default sort: newest first
            transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            set({ transactions, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to load transactions', isLoading: false });
        }
    },

    loadSummary: async () => {
        const { currentAccount } = get();
        if (!currentAccount) {
            set({ summary: null });
            return;
        }

        try {
            const summary = await financeRepository.getSummary(currentAccount.id);
            set({ summary });
        } catch (error) {
            console.error('Failed to load summary', error);
        }
    },

    createTransaction: async (input: CreateTransactionInput) => {
        const { currentAccount, loadTransactions, loadSummary, loadBalances } = get();
        if (!currentAccount) throw new Error('No account selected');

        set({ isLoading: true, error: null });
        try {
            await financeRepository.create({
                ...input,
                accountId: currentAccount.id
            });

            // Refresh data
            await Promise.all([
                loadTransactions(),
                loadSummary(),
                loadBalances() // Update balances list too
            ]);

            set({ isLoading: false });
        } catch (error) {
            set({ error: 'Failed to create transaction', isLoading: false });
            throw error;
        }
    },

    updateTransaction: async (id: string, input: UpdateTransactionInput) => {
        const { loadTransactions, loadSummary, loadBalances } = get();
        set({ isLoading: true, error: null });
        try {
            await financeRepository.update(id, input);
            await Promise.all([
                loadTransactions(),
                loadSummary(),
                loadBalances()
            ]);
            set({ isLoading: false });
        } catch (error) {
            set({ error: 'Failed to update transaction', isLoading: false });
            throw error;
        }
    },

    deleteTransaction: async (id: string) => {
        const { loadTransactions, loadSummary, loadBalances } = get();
        set({ isLoading: true, error: null });
        try {
            await financeRepository.delete(id);
            await Promise.all([
                loadTransactions(),
                loadSummary(),
                loadBalances()
            ]);
            set({ isLoading: false });
        } catch (error) {
            set({ error: 'Failed to delete transaction', isLoading: false });
            throw error;
        }
    },

    markTransactionAsVisited: async (id: string) => {
        const { currentAccount } = get();
        if (!currentAccount) return;

        try {
            await financeRepository.markAsVisited(id);
            const transactions = await financeRepository.getAll(currentAccount.id);
            set({ transactions });
        } catch (error) {
            console.error('Failed to mark transaction as visited:', error);
        }
    },

    filterByType: async (type: 'income' | 'expense' | 'all') => {
        const { currentAccount } = get();
        if (!currentAccount) return;

        set({ isLoading: true, error: null });
        try {
            // Note: Repository getByType doesn't support account filtering yet in this quick impl,
            // better to fetch all for account then filter in memory or update repo.
            // For now, let's just fetch all filtered by account and memory filter since list is small-ish
            // OR update repository getAll to accept type filter + accountId.
            // Let's rely on getAll(accountId) then filter array for consistency

            const all = await financeRepository.getAll(currentAccount.id);
            if (type === 'all') {
                set({ transactions: all, isLoading: false });
            } else {
                set({
                    transactions: all.filter(t => t.type === type),
                    isLoading: false
                });
            }
        } catch (error) {
            set({ error: 'Failed to filter transactions', isLoading: false });
        }
    },

    syncAccountToCloud: async (id: string) => {
        const account = get().accounts.find(a => a.id === id);
        if (!account) throw new Error("Account not found locally");

        // Fetch all transactions for this account locally
        const transactions = await financeRepository.getAll(id);

        // Push to cloud
        await backendFinanceRepository.syncAccount(account, transactions);
    },
}));
