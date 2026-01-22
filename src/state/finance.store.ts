/**
 * Finance Store (Zustand)
 * State management untuk Finance Transactions
 */

import { create } from 'zustand';
import type {
    FinanceTransaction,
    Wallet,
    CreateTransactionInput,
    UpdateTransactionInput,
    CreateWalletInput,
    UpdateWalletInput,
    FinanceSummary
} from '../types/finance';
import { financeRepository, backendFinanceRepository, localFinanceRepository } from '../data/finance.repository';

interface FinanceState {
    // Wallets State
    wallets: Wallet[];
    currentWallet: Wallet | null;

    // Transactions State (Active Wallet)
    transactions: FinanceTransaction[];
    summary: FinanceSummary | null;
    balances: Record<string, number>; // Balance cache for all wallets

    // Dashboard State (Global)
    globalSummary: FinanceSummary | null;
    monthlySummary: FinanceSummary | null; // Summary untuk bulan ini
    recentTransactions: FinanceTransaction[];

    // UI State
    isLoading: boolean;
    error: string | null;

    // Wallet Actions
    loadWallets: () => Promise<void>;
    loadBalances: () => Promise<void>; // Load balances for all loaded wallets
    createWallet: (input: CreateWalletInput) => Promise<Wallet>;
    updateWallet: (id: string, input: UpdateWalletInput) => Promise<void>;
    selectWallet: (walletId: string) => Promise<void>;
    deleteWallet: (id: string) => Promise<void>;
    markWalletAsVisited: (id: string) => Promise<void>;
    archiveWallet: (id: string) => Promise<void>;
    restoreWallet: (id: string) => Promise<void>;

    // Transaction Actions
    loadTransactions: () => Promise<void>;
    loadSummary: () => Promise<void>;
    createTransaction: (input: CreateTransactionInput) => Promise<void>;
    updateTransaction: (id: string, input: UpdateTransactionInput) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    markTransactionAsVisited: (id: string) => Promise<void>;
    filterByType: (type: 'income' | 'expense' | 'all') => void;
    syncWalletToCloud: (id: string) => Promise<void>;
    syncWalletToLocal: (id: string) => Promise<void>;

    // Dashboard Actions
    loadGlobalSummary: () => Promise<void>;
    loadMonthlySummary: () => Promise<void>;
    loadRecentTransactions: (limit?: number) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
    wallets: [],
    currentWallet: null,
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

    // --- Wallet Actions ---

    loadWallets: async () => {
        if (get().isLoading) return;
        set({ isLoading: true, error: null });
        try {
            let wallets = await financeRepository.getAllWallets();

            // Auto-generate Main Wallet if no wallets exist (New User / Empty State)
            if (wallets.length === 0) {
                try {
                    const mainWallet = await financeRepository.createWallet({
                        title: 'Main Wallet',
                        description: 'Default Wallet',
                        currency: 'IDR'
                    });
                    wallets = [mainWallet];
                } catch (createError) {
                    console.error('Failed to auto-create main wallet', createError);
                    // Continue with empty list if creation fails, don't block entirely
                }
            }

            set({ wallets, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to load wallets', isLoading: false });
        }
    },

    loadBalances: async () => {
        const { wallets } = get();
        const balances: Record<string, number> = {};

        try {
            await Promise.all(wallets.map(async (wallet) => {
                const summary = await financeRepository.getSummary(wallet.id);
                balances[wallet.id] = summary.balance;
            }));
            set({ balances });
        } catch (error) {
            console.error('Failed to load balances', error);
        }
    },

    createWallet: async (input: CreateWalletInput) => {
        const { wallets } = get();
        const exists = wallets.some(w => w.title.toLowerCase() === input.title.trim().toLowerCase());

        if (exists) {
            const error = 'Wallet title already exists';
            set({ error });
            throw new Error(error);
        }

        try {
            const newWallet = await financeRepository.createWallet(input);
            set((state) => ({
                wallets: [...state.wallets, newWallet]
            }));
            return newWallet;
        } catch (error) {
            set({ error: 'Failed to create wallet' });
            throw error;
        }
    },

    updateWallet: async (id: string, input: UpdateWalletInput) => {
        if (input.title) {
            const { wallets } = get();
            const exists = wallets.some(w =>
                w.id !== id &&
                w.title.toLowerCase() === input.title!.trim().toLowerCase()
            );

            if (exists) {
                const error = 'Wallet title already exists';
                set({ error });
                throw new Error(error);
            }
        }

        try {
            await financeRepository.updateWallet(id, input);
            const wallets = await financeRepository.getAllWallets();
            set({ wallets });

            // Update current wallet if matched
            const { currentWallet } = get();
            if (currentWallet?.id === id) {
                const updated = wallets.find(w => w.id === id) || null;
                set({ currentWallet: updated });
            }
        } catch (error) {
            set({ error: 'Failed to update wallet' });
        }
    },

    selectWallet: async (walletId: string) => {
        const { wallets, loadTransactions, loadSummary } = get();
        // If wallets not loaded yet?
        let targetWallet = wallets.find(w => w.id === walletId);

        if (!targetWallet) {
            // Try fetch fresh
            const refreshedWallets = await financeRepository.getAllWallets();
            targetWallet = refreshedWallets.find(w => w.id === walletId);
            set({ wallets: refreshedWallets });
        }

        if (targetWallet) {
            set({ currentWallet: targetWallet });
            // Load data for this wallet
            await loadTransactions();
            await loadSummary();
        }
    },

    deleteWallet: async (id: string) => {
        try {
            await financeRepository.deleteWallet(id);
            const wallets = await financeRepository.getAllWallets();
            set({ wallets });
            if (get().currentWallet?.id === id) {
                set({ currentWallet: null });
            }
        } catch (error) {
            set({ error: 'Failed to delete wallet' });
        }
    },

    markWalletAsVisited: async (id: string) => {
        try {
            await financeRepository.markWalletAsVisited(id);
        } catch (error) {
            console.error('Failed to mark wallet as visited', error);
        }
    },

    archiveWallet: async (id: string) => {
        try {
            await financeRepository.updateWallet(id, { isArchived: true });
            get().loadWallets();
        } catch (error) {
            console.error('Failed to archive wallet', error);
        }
    },

    restoreWallet: async (id: string) => {
        try {
            await financeRepository.updateWallet(id, { isArchived: false });
            get().loadWallets();
        } catch (error) {
            console.error('Failed to restore wallet', error);
        }
    },

    // --- Transaction Actions ---

    loadTransactions: async () => {
        const { currentWallet } = get();
        if (!currentWallet) return;

        set({ isLoading: true, error: null });
        try {
            const transactions = await financeRepository.getAll(currentWallet.id);
            // Default sort: newest first
            transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            set({ transactions, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to load transactions', isLoading: false });
        }
    },

    loadSummary: async () => {
        const { currentWallet } = get();
        if (!currentWallet) {
            set({ summary: null });
            return;
        }

        try {
            const summary = await financeRepository.getSummary(currentWallet.id);
            set({ summary });
        } catch (error) {
            console.error('Failed to load summary', error);
        }
    },

    createTransaction: async (input: CreateTransactionInput) => {
        const {
            currentWallet,
            loadTransactions,
            loadSummary,
            loadBalances,
            loadGlobalSummary,
            loadMonthlySummary,
            loadRecentTransactions
        } = get();

        const targetWalletId = input.walletId || currentWallet?.id;

        if (!targetWalletId) throw new Error('No wallet selected');

        set({ isLoading: true, error: null });
        try {
            await financeRepository.create({
                ...input,
                walletId: targetWalletId
            });

            // Refresh data plan
            const promises = [loadBalances()];

            // If we are currently viewing this wallet, update detail views
            if (currentWallet && currentWallet.id === targetWalletId) {
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
        const { currentWallet } = get();
        if (!currentWallet) return;

        try {
            await financeRepository.markAsVisited(id);
            const transactions = await financeRepository.getAll(currentWallet.id);
            set({ transactions });
        } catch (error) {
            console.error('Failed to mark transaction as visited:', error);
        }
    },

    filterByType: async (type: 'income' | 'expense' | 'all') => {
        const { currentWallet } = get();
        if (!currentWallet) return;

        set({ isLoading: true, error: null });
        try {
            const all = await financeRepository.getAll(currentWallet.id);
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

    syncWalletToCloud: async (id: string) => {
        const wallet = get().wallets.find(w => w.id === id);
        if (!wallet) throw new Error("Wallet not found locally");

        // Fetch all transactions for this wallet locally
        const transactions = await financeRepository.getAll(id);

        // Push to cloud
        await backendFinanceRepository.syncWallet(wallet, transactions);
    },

    syncWalletToLocal: async (id: string) => {
        const wallet = get().wallets.find(w => w.id === id);
        if (!wallet) throw new Error("Wallet not found");

        // Fetch all transactions (from current source, e.g. Backend)
        const transactions = await financeRepository.getAll(id);

        // Push to local
        await localFinanceRepository.syncWallet(wallet, transactions);
    },

    // --- Dashboard Actions ---

    loadGlobalSummary: async () => {
        const { wallets } = get();

        try {
            let totalIncome = 0;
            let totalExpense = 0;
            let transactionCount = 0;

            // Aggregate summary dari semua wallet yang tidak di-archive
            const activeWallets = wallets.filter(w => !w.isArchived);

            await Promise.all(activeWallets.map(async (wallet) => {
                const summary = await financeRepository.getSummary(wallet.id);
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
        const { wallets } = get();

        try {
            // Get current month range
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

            let totalIncome = 0;
            let totalExpense = 0;
            let transactionCount = 0;

            // Fetch all transactions dan filter by bulan ini
            const activeWallets = wallets.filter(w => !w.isArchived);

            await Promise.all(activeWallets.map(async (wallet) => {
                const allTransactions = await financeRepository.getAll(wallet.id);
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
        const { wallets } = get();

        try {
            const allTransactions: FinanceTransaction[] = [];
            const activeWallets = wallets.filter(w => !w.isArchived);

            // Fetch all transactions dari semua wallet
            await Promise.all(activeWallets.map(async (wallet) => {
                const transactions = await financeRepository.getAll(wallet.id);
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
