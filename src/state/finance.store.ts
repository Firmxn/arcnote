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
import { financeRepository, backendFinanceRepository, localFinanceRepository } from '../data/finance.repository';

interface FinanceState {
    // Accounts State
    accounts: FinanceAccount[];
    currentAccount: FinanceAccount | null;

    // Transactions State (Active Account)
    transactions: FinanceTransaction[];
    summary: FinanceSummary | null;
    balances: Record<string, number>; // Balance cache for all accounts

    // Dashboard State (Global)
    globalSummary: FinanceSummary | null;
    monthlySummary: FinanceSummary | null; // Summary untuk bulan ini
    recentTransactions: FinanceTransaction[];

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
    archiveAccount: (id: string) => Promise<void>;
    restoreAccount: (id: string) => Promise<void>;

    // Transaction Actions
    loadTransactions: () => Promise<void>;
    loadSummary: () => Promise<void>;
    createTransaction: (input: CreateTransactionInput) => Promise<void>;
    updateTransaction: (id: string, input: UpdateTransactionInput) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    markTransactionAsVisited: (id: string) => Promise<void>;
    filterByType: (type: 'income' | 'expense' | 'all') => void;
    syncAccountToCloud: (id: string) => Promise<void>;
    syncAccountToLocal: (id: string) => Promise<void>;

    // Dashboard Actions
    loadGlobalSummary: () => Promise<void>;
    loadMonthlySummary: () => Promise<void>;
    loadRecentTransactions: (limit?: number) => Promise<void>;
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

    // Dashboard initial state
    globalSummary: null,
    monthlySummary: null,
    recentTransactions: [],

    isLoading: false,
    error: null,

    // --- Account Actions ---

    loadAccounts: async () => {
        if (get().isLoading) return;
        set({ isLoading: true, error: null });
        try {
            let accounts = await financeRepository.getAllAccounts();

            // Auto-generate Main Wallet if no accounts exist (New User / Empty State)
            if (accounts.length === 0) {
                try {
                    const mainWallet = await financeRepository.createAccount({
                        title: 'Main Wallet',
                        description: 'Default Wallet',
                        currency: 'IDR'
                    });
                    accounts = [mainWallet];
                } catch (createError) {
                    console.error('Failed to auto-create main wallet', createError);
                    // Continue with empty list if creation fails, don't block entirely
                }
            }

            set({ accounts, isLoading: false });
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
        const { accounts } = get();
        const exists = accounts.some(a => a.title.toLowerCase() === input.title.trim().toLowerCase());

        if (exists) {
            const error = 'Wallet title already exists';
            set({ error });
            throw new Error(error);
        }

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
        if (input.title) {
            const { accounts } = get();
            const exists = accounts.some(a =>
                a.id !== id &&
                a.title.toLowerCase() === input.title!.trim().toLowerCase()
            );

            if (exists) {
                const error = 'Wallet title already exists';
                set({ error });
                throw new Error(error);
            }
        }

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
        } catch (error) {
            console.error('Failed to mark account as visited', error);
        }
    },

    archiveAccount: async (id: string) => {
        try {
            await financeRepository.updateAccount(id, { isArchived: true });
            get().loadAccounts();
        } catch (error) {
            console.error('Failed to archive account', error);
        }
    },

    restoreAccount: async (id: string) => {
        try {
            await financeRepository.updateAccount(id, { isArchived: false });
            get().loadAccounts();
        } catch (error) {
            console.error('Failed to restore account', error);
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
        const {
            currentAccount,
            loadTransactions,
            loadSummary,
            loadBalances,
            loadGlobalSummary,
            loadMonthlySummary,
            loadRecentTransactions
        } = get();

        const targetAccountId = input.accountId || currentAccount?.id;

        if (!targetAccountId) throw new Error('No account selected');

        set({ isLoading: true, error: null });
        try {
            await financeRepository.create({
                ...input,
                accountId: targetAccountId
            });

            // Refresh data plan
            const promises = [loadBalances()];

            // If we are currently viewing this account, update detail views
            if (currentAccount && currentAccount.id === targetAccountId) {
                promises.push(loadTransactions());
                promises.push(loadSummary());
            }

            // Update dashboard data
            if (loadGlobalSummary) promises.push(loadGlobalSummary());
            if (loadMonthlySummary) promises.push(loadMonthlySummary());
            if (loadRecentTransactions) promises.push(loadRecentTransactions(5));

            await Promise.all(promises);

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

    syncAccountToLocal: async (id: string) => {
        const account = get().accounts.find(a => a.id === id);
        if (!account) throw new Error("Account not found");

        // Fetch all transactions (from current source, e.g. Backend)
        const transactions = await financeRepository.getAll(id);

        // Push to local
        await localFinanceRepository.syncAccount(account, transactions);
    },

    // --- Dashboard Actions ---

    loadGlobalSummary: async () => {
        const { accounts } = get();

        try {
            let totalIncome = 0;
            let totalExpense = 0;
            let transactionCount = 0;

            // Aggregate summary dari semua account yang tidak di-archive
            const activeAccounts = accounts.filter(a => !a.isArchived);

            await Promise.all(activeAccounts.map(async (acc) => {
                const summary = await financeRepository.getSummary(acc.id);
                totalIncome += summary.totalIncome;
                totalExpense += summary.totalExpense;
                transactionCount += summary.transactionCount;
            }));

            set({
                globalSummary: {
                    totalIncome,
                    totalExpense,
                    balance: totalIncome - totalExpense,
                    transactionCount
                }
            });
        } catch (error) {
            console.error('Failed to load global summary', error);
        }
    },

    loadMonthlySummary: async () => {
        const { accounts } = get();

        try {
            // Get current month range
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

            let totalIncome = 0;
            let totalExpense = 0;
            let transactionCount = 0;

            // Fetch all transactions dan filter by bulan ini
            const activeAccounts = accounts.filter(a => !a.isArchived);

            await Promise.all(activeAccounts.map(async (acc) => {
                const allTransactions = await financeRepository.getAll(acc.id);
                const monthlyTransactions = allTransactions.filter(t => {
                    const txDate = new Date(t.date);
                    return txDate >= startOfMonth && txDate <= endOfMonth;
                });

                monthlyTransactions.forEach(t => {
                    if (t.type === 'income') {
                        totalIncome += t.amount;
                    } else {
                        totalExpense += t.amount;
                    }
                    transactionCount++;
                });
            }));

            set({
                monthlySummary: {
                    totalIncome,
                    totalExpense,
                    balance: totalIncome - totalExpense,
                    transactionCount
                }
            });
        } catch (error) {
            console.error('Failed to load monthly summary', error);
        }
    },

    loadRecentTransactions: async (limit: number = 10) => {
        const { accounts } = get();

        try {
            const allTransactions: FinanceTransaction[] = [];
            const activeAccounts = accounts.filter(a => !a.isArchived);

            // Fetch all transactions dari semua account
            await Promise.all(activeAccounts.map(async (acc) => {
                const transactions = await financeRepository.getAll(acc.id);
                allTransactions.push(...transactions);
            }));

            // Sort by date descending dan limit
            const sorted = allTransactions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, limit);

            set({ recentTransactions: sorted });
        } catch (error) {
            console.error('Failed to load recent transactions', error);
        }
    },
}));
