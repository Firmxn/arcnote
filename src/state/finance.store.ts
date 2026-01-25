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
    FinanceSummary,
    Budget,
    BudgetAssignment,
    CreateBudgetInput,
    UpdateBudgetInput,
    BudgetSummary
} from '../types/finance';
import { financeRepository } from '../data/finance.repository';

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

    // Budget State
    budgets: Budget[];
    budgetAssignments: BudgetAssignment[];
    currentBudget: Budget | null;
    budgetSummaries: Record<string, BudgetSummary>; // Cache budget summaries by budgetId

    // Wallet Actions
    loadWallets: () => Promise<void>;
    loadBalances: () => Promise<void>; // Load balances for all loaded wallets
    createWallet: (input: CreateWalletInput) => Promise<Wallet>;
    updateWallet: (id: string, input: UpdateWalletInput) => Promise<void>;
    selectWallet: (walletId: string) => Promise<void>;
    deleteWallet: (id: string) => Promise<void>;
    permanentDeleteWallet: (id: string) => Promise<void>; // Delete permanent dari DB
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


    // Dashboard Actions
    loadGlobalSummary: () => Promise<void>;
    loadMonthlySummary: () => Promise<void>;
    loadRecentTransactions: (limit?: number) => Promise<void>;

    // Transfer Actions
    transferBetweenWallets: (fromWalletId: string, toWalletId: string, amount: number, description?: string, date?: Date) => Promise<void>;

    // Budget Actions
    loadBudgets: () => Promise<void>;
    createBudget: (input: CreateBudgetInput) => Promise<Budget>;
    updateBudget: (id: string, input: UpdateBudgetInput) => Promise<void>;
    deleteBudget: (id: string) => Promise<void>;
    selectBudget: (budgetId: string) => Promise<void>;
    loadBudgetSummary: (budgetId: string) => Promise<BudgetSummary>;

    // Budget Assignment Actions
    assignTransactionToBudget: (transactionId: string, budgetId: string) => Promise<void>;
    unassignTransactionFromBudget: (transactionId: string, budgetId: string) => Promise<void>;
    loadAssignmentsForBudget: (budgetId: string) => Promise<BudgetAssignment[]>;
    getAssignmentsForTransaction: (transactionId: string) => Promise<BudgetAssignment[]>;

    // Reset State
    resetState: () => void;
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

    // Budget initial state
    budgets: [],
    budgetAssignments: [],
    currentBudget: null,
    budgetSummaries: {},

    // --- Wallet Actions ---

    loadWallets: async () => {
        if (get().isLoading) return;
        set({ isLoading: true, error: null });
        try {
            let wallets = await financeRepository.getAllWallets();

            // Auto-generate Main Wallet jika tidak ada wallet sama sekali
            if (wallets.length === 0) {
                // Cek konteks user untuk menentukan apakah boleh buat Main Wallet
                const lastPull = localStorage.getItem('arcnote_last_pull');
                const userId = localStorage.getItem('arcnote_user_id');

                /**
                 * Hanya buat Main Wallet jika:
                 * 1. User belum login (mode offline) - userId belum ada
                 * 2. Sync sudah pernah berjalan (lastPull ada) - artinya data cloud sudah di-pull
                 *    dan memang kosong, jadi aman untuk buat Main Wallet baru
                 * 
                 * Jika userId ada tapi lastPull belum ada, berarti:
                 * - User baru login tapi sync belum selesai
                 * - Jangan buat Main Wallet dulu, tunggu sync selesai
                 * - Data mungkin ada di cloud dan akan di-pull
                 */
                const isOfflineMode = !userId;
                const isSyncCompleted = !!lastPull;

                if (isOfflineMode || isSyncCompleted) {
                    // Cek lagi apakah sudah ada Main Wallet (double-check setelah sync)
                    const existingMain = await financeRepository.getMainWallet();
                    if (!existingMain) {
                        try {
                            const mainWallet = await financeRepository.createWallet({
                                title: 'Main Wallet',
                                description: 'Default Wallet',
                                currency: 'IDR',
                                isMain: true // Tandai sebagai main wallet
                            });
                            wallets = [mainWallet];
                            console.log('✅ Auto-created Main Wallet');
                        } catch (createError) {
                            console.error('Failed to auto-create main wallet', createError);
                        }
                    }
                } else {
                    // User login tapi sync belum selesai - tunggu sync
                    console.log('⏳ Waiting for sync to complete before creating Main Wallet...');
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

    /**
     * Soft Delete Wallet
     * Wallet hanya di-archive, transaksi tetap ada untuk riwayat
     * Gunakan permanentDeleteWallet() jika benar-benar ingin hapus
     */
    deleteWallet: async (id: string) => {
        try {
            // Soft delete: hanya set isArchived = true
            await financeRepository.updateWallet(id, { isArchived: true });
            const wallets = await financeRepository.getAllWallets();
            set({ wallets });
            if (get().currentWallet?.id === id) {
                set({ currentWallet: null });
            }
        } catch (error) {
            set({ error: 'Failed to delete wallet' });
        }
    },

    /**
     * Permanent Delete (Hard Delete)
     * Menghapus wallet dan semua data terkait dari DB selamanya
     * Hanya digunakan di Archive Page
     */
    permanentDeleteWallet: async (id: string) => {
        try {
            await financeRepository.deleteWallet(id);
            const wallets = await financeRepository.getAllWallets();
            set({ wallets });
            // Jika kebetulan sedang view wallet ini (sangat jarang terjadi jika dari archive)
            if (get().currentWallet?.id === id) {
                set({ currentWallet: null });
            }
        } catch (error) {
            set({ error: 'Failed to permanently delete wallet' });
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

    // --- Transfer Actions ---
    transferBetweenWallets: async (
        fromWalletId: string,
        toWalletId: string,
        amount: number,
        description?: string,
        date?: Date
    ) => {
        set({ isLoading: true, error: null });
        try {
            // Eksekusi transfer via repository
            await financeRepository.transferBetweenWallets(
                fromWalletId,
                toWalletId,
                amount,
                description,
                date
            );

            // Reload balances dari database untuk memastikan konsistensi
            await get().loadBalances();

            // Jika sedang melihat salah satu wallet, reload transactions
            const { currentWallet } = get();
            if (currentWallet && (currentWallet.id === fromWalletId || currentWallet.id === toWalletId)) {
                await get().loadTransactions();
                await get().loadSummary();
            }

            set({ isLoading: false });
        } catch (error) {
            set({ error: 'Gagal melakukan transfer', isLoading: false });
            throw error;
        }
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

    // --- Budget Actions ---

    loadBudgets: async () => {
        set({ isLoading: true, error: null });
        try {
            const budgets = await financeRepository.getAllBudgets();
            set({ budgets, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to load budgets', isLoading: false });
        }
    },

    createBudget: async (input: CreateBudgetInput) => {
        const { budgets } = get();
        const exists = budgets.some(b => b.title.toLowerCase() === input.title.trim().toLowerCase());

        if (exists) {
            const error = 'Budget title already exists';
            set({ error });
            throw new Error(error);
        }

        try {
            const newBudget = await financeRepository.createBudget(input);
            set((state) => ({
                budgets: [...state.budgets, newBudget]
            }));
            return newBudget;
        } catch (error) {
            set({ error: 'Failed to create budget' });
            throw error;
        }
    },

    updateBudget: async (id: string, input: UpdateBudgetInput) => {
        if (input.title) {
            const { budgets } = get();
            const exists = budgets.some(b =>
                b.id !== id &&
                b.title.toLowerCase() === input.title!.trim().toLowerCase()
            );

            if (exists) {
                const error = 'Budget title already exists';
                set({ error });
                throw new Error(error);
            }
        }

        try {
            await financeRepository.updateBudget(id, input);
            const budgets = await financeRepository.getAllBudgets();
            set({ budgets });

            // Update current budget if matched
            const { currentBudget } = get();
            if (currentBudget?.id === id) {
                const updated = budgets.find(b => b.id === id) || null;
                set({ currentBudget: updated });
            }
        } catch (error) {
            set({ error: 'Failed to update budget' });
        }
    },

    deleteBudget: async (id: string) => {
        try {
            await financeRepository.deleteBudget(id);
            const budgets = await financeRepository.getAllBudgets();
            set({ budgets });
            if (get().currentBudget?.id === id) {
                set({ currentBudget: null });
            }
        } catch (error) {
            set({ error: 'Failed to delete budget' });
        }
    },

    selectBudget: async (budgetId: string) => {
        const { budgets } = get();
        let targetBudget = budgets.find(b => b.id === budgetId);

        if (!targetBudget) {
            // Try fetch fresh
            const refreshedBudgets = await financeRepository.getAllBudgets();
            targetBudget = refreshedBudgets.find(b => b.id === budgetId);
            set({ budgets: refreshedBudgets });
        }

        if (targetBudget) {
            set({ currentBudget: targetBudget });
            // Load summary for this budget
            await get().loadBudgetSummary(budgetId);
        }
    },

    loadBudgetSummary: async (budgetId: string) => {
        try {
            const budget = await financeRepository.getBudgetById(budgetId);
            if (!budget) throw new Error('Budget not found');

            // Calculate period range based on budget period
            const now = new Date();
            let periodStart: Date;
            let periodEnd: Date;

            switch (budget.period) {
                case 'weekly':
                    // Current week (Monday - Sunday)
                    const dayOfWeek = now.getDay();
                    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Monday start
                    periodStart = new Date(now);
                    periodStart.setDate(now.getDate() + diff);
                    periodStart.setHours(0, 0, 0, 0);
                    periodEnd = new Date(periodStart);
                    periodEnd.setDate(periodStart.getDate() + 6);
                    periodEnd.setHours(23, 59, 59, 999);
                    break;

                case 'monthly':
                    // Current month
                    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                    break;

                case 'yearly':
                    // Current year
                    periodStart = new Date(now.getFullYear(), 0, 1);
                    periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                    break;

                default:
                    throw new Error('Invalid budget period');
            }

            const summary = await financeRepository.getBudgetSummary(budgetId, periodStart, periodEnd);

            set((state) => ({
                budgetSummaries: {
                    ...state.budgetSummaries,
                    [budgetId]: summary
                }
            }));

            return summary;
        } catch (error) {
            console.error('Failed to load budget summary', error);
            throw error;
        }
    },

    // --- Budget Assignment Actions ---

    assignTransactionToBudget: async (transactionId: string, budgetId: string) => {
        try {
            await financeRepository.assignTransactionToBudget(transactionId, budgetId);

            // Reload budget summary untuk update spending
            await get().loadBudgetSummary(budgetId);

            // Reload assignments jika currentBudget adalah budget ini
            if (get().currentBudget?.id === budgetId) {
                await get().loadAssignmentsForBudget(budgetId);
            }
        } catch (error) {
            set({ error: 'Failed to assign transaction to budget' });
            throw error;
        }
    },

    unassignTransactionFromBudget: async (transactionId: string, budgetId: string) => {
        try {
            await financeRepository.unassignTransactionFromBudget(transactionId, budgetId);

            // Reload budget summary untuk update spending
            await get().loadBudgetSummary(budgetId);

            // Reload assignments jika currentBudget adalah budget ini
            if (get().currentBudget?.id === budgetId) {
                await get().loadAssignmentsForBudget(budgetId);
            }
        } catch (error) {
            set({ error: 'Failed to unassign transaction from budget' });
            throw error;
        }
    },

    loadAssignmentsForBudget: async (budgetId: string) => {
        try {
            const assignments = await financeRepository.getAssignmentsForBudget(budgetId);
            set({ budgetAssignments: assignments });
            return assignments;
        } catch (error) {
            console.error('Failed to load budget assignments', error);
            return [];
        }
    },
    getAssignmentsForTransaction: async (transactionId: string) => {
        try {
            return await financeRepository.getAssignmentsForTransaction(transactionId);
        } catch (error) {
            console.error('Failed to load transaction assignments', error);
            return [];
        }
    },

    resetState: () => {
        set({
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
            globalSummary: null,
            monthlySummary: null,
            recentTransactions: [],
            isLoading: false,
            error: null,
            budgets: [],
            budgetAssignments: [],
            currentBudget: null,
            budgetSummaries: {},
        });
    },
}));
