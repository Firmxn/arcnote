/**
 * Finance Repository (Unified Local-First)
 *
 * Architecture:
 * - Reads: Always from Local DB (Dexie)
 * - Writes: Update Local DB + Set Sync Flag ('created' | 'updated')
 * - Deletes: Delete Local DB + Add to Sync Queue
 *
 * Background Sync Service will handle pushing changes to Supabase.
 */

import { db } from './db';
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
import { nanoid } from 'nanoid';

/**
 * Interface Repository
 */
interface FinanceRepo {
    // --- WALLETS ---
    getAllWallets(): Promise<Wallet[]>;
    getWalletById(id: string): Promise<Wallet | undefined>;
    getMainWallet(): Promise<Wallet | undefined>;
    createWallet(input: CreateWalletInput): Promise<Wallet>;
    updateWallet(id: string, input: UpdateWalletInput): Promise<Wallet | undefined>;
    deleteWallet(id: string): Promise<void>;
    markWalletAsVisited(id: string): Promise<void>;

    // --- TRANSACTIONS ---
    getAll(walletId?: string): Promise<FinanceTransaction[]>;
    getById(id: string): Promise<FinanceTransaction | undefined>;
    getTransactionsByIds(ids: string[]): Promise<FinanceTransaction[]>;
    create(input: CreateTransactionInput): Promise<FinanceTransaction>;
    update(id: string, input: UpdateTransactionInput): Promise<FinanceTransaction | undefined>;
    delete(id: string): Promise<void>;
    markAsVisited(id: string): Promise<void>;
    getSummary(walletId?: string): Promise<FinanceSummary>;

    // --- TRANSFER ---
    transferBetweenWallets(fromWalletId: string, toWalletId: string, amount: number, description?: string, date?: Date): Promise<{ outTransaction: FinanceTransaction; inTransaction: FinanceTransaction }>;

    // --- BUDGETS ---
    getAllBudgets(): Promise<Budget[]>;
    getBudgetById(id: string): Promise<Budget | undefined>;
    createBudget(input: CreateBudgetInput): Promise<Budget>;
    updateBudget(id: string, input: UpdateBudgetInput): Promise<Budget | undefined>;
    deleteBudget(id: string): Promise<void>;
    getBudgetSummary(budgetId: string, periodStart: Date, periodEnd: Date): Promise<BudgetSummary>;

    // --- BUDGET ASSIGNMENTS ---
    assignTransactionToBudget(transactionId: string, budgetId: string): Promise<BudgetAssignment>;
    unassignTransactionFromBudget(transactionId: string, budgetId: string): Promise<void>;
    getAssignmentsForBudget(budgetId: string): Promise<BudgetAssignment[]>;
    getAssignmentsForTransaction(transactionId: string): Promise<BudgetAssignment[]>;
}

export const financeRepository: FinanceRepo = {
    // --- WALLETS ---
    async getAllWallets(): Promise<Wallet[]> {
        return await db.wallets.orderBy('createdAt').toArray();
    },

    async getWalletById(id: string): Promise<Wallet | undefined> {
        return await db.wallets.get(id);
    },

    /**
     * Mencari Main Wallet berdasarkan flag isMain atau fallback ke title
     * Backward compatible dengan wallet lama yang belum punya isMain
     */
    async getMainWallet(): Promise<Wallet | undefined> {
        // Cari berdasarkan isMain flag (metode baru)
        const byFlag = await db.wallets.filter(w => w.isMain === true).first();
        if (byFlag) return byFlag;

        // Fallback: cari berdasarkan title "Main Wallet" (backward compat)
        const byTitle = await db.wallets
            .filter(w => w.title === 'Main Wallet')
            .first();
        return byTitle;
    },

    async createWallet(input: CreateWalletInput): Promise<Wallet> {
        const now = new Date();
        const wallet: Wallet = {
            id: nanoid(),
            ...input,
            createdAt: now,
            updatedAt: now,
            syncStatus: 'created', // Sync Flag
        };
        await db.wallets.add(wallet);
        return wallet;
    },

    async updateWallet(id: string, input: UpdateWalletInput): Promise<Wallet | undefined> {
        const wallet = await db.wallets.get(id);
        if (!wallet) return undefined;

        const updated: Wallet = {
            ...wallet,
            ...input,
            updatedAt: new Date(),
            syncStatus: wallet.syncStatus === 'created' ? 'created' : 'updated', // Keep 'created' if not yet synced
        };

        await db.wallets.put(updated);
        return updated;
    },

    async deleteWallet(id: string): Promise<void> {
        return db.transaction('rw', db.wallets, db.finance, db.syncQueue, async () => {
            // 1. Queue Transactions Deletion (Avoid FK Constraint in Supabase)
            const transactions = await db.finance.where('walletId').equals(id).toArray();
            const transactionQueueItems = transactions.map(t => ({
                id: t.id,
                table: 'finance', // Use Dexie table name for mapping
                action: 'delete' as const,
                createdAt: new Date()
            }));

            if (transactionQueueItems.length > 0) {
                await db.syncQueue.bulkAdd(transactionQueueItems);
            }

            // 2. Queue Wallet Deletion
            await db.syncQueue.add({
                id,
                table: 'wallets',
                action: 'delete',
                createdAt: new Date()
            });

            // 3. Local Delete (Manual Cascade)
            // Use bulkDelete for performance if many transactions
            if (transactions.length > 0) {
                await db.finance.bulkDelete(transactions.map(t => t.id));
            }
            await db.wallets.delete(id);
        });
    },

    async markWalletAsVisited(id: string): Promise<void> {
        // This is a minor update, optionally sync it
        await db.wallets.update(id, { lastVisitedAt: new Date() });
    },

    // --- TRANSACTIONS ---
    async getAll(walletId?: string): Promise<FinanceTransaction[]> {
        let transactions: FinanceTransaction[];

        if (walletId) {
            transactions = await db.finance
                .where('walletId')
                .equals(walletId)
                .toArray();
        } else {
            transactions = await db.finance.toArray();
        }

        // Sort: Date (Day) DESC, then CreatedAt DESC
        return transactions.sort((a, b) => {
            const dayA = new Date(a.date).setHours(0, 0, 0, 0);
            const dayB = new Date(b.date).setHours(0, 0, 0, 0);
            const dateDiff = dayB - dayA;
            if (dateDiff !== 0) return dateDiff;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    },

    async getById(id: string): Promise<FinanceTransaction | undefined> {
        return await db.finance.get(id);
    },

    async getTransactionsByIds(ids: string[]): Promise<FinanceTransaction[]> {
        const transactions = await db.finance.bulkGet(ids);
        return transactions.filter((t): t is FinanceTransaction => !!t);
    },

    async create(input: CreateTransactionInput): Promise<FinanceTransaction> {
        const now = new Date();
        const transaction: FinanceTransaction = {
            id: nanoid(),
            ...input,
            createdAt: now,
            updatedAt: now,
            syncStatus: 'created', // Sync Flag
        };

        return db.transaction('rw', db.finance, db.wallets, async () => {
            await db.finance.add(transaction);

            // Update wallet's updatedAt (trigger wallet sync too)
            const wallet = await db.wallets.get(input.walletId);
            if (wallet) {
                await db.wallets.update(input.walletId, {
                    updatedAt: now,
                    syncStatus: wallet.syncStatus === 'created' ? 'created' : 'updated'
                });
            }

            return transaction;
        });
    },

    async update(id: string, input: UpdateTransactionInput): Promise<FinanceTransaction | undefined> {
        const transaction = await db.finance.get(id);
        if (!transaction) {
            throw new Error(`Transaction with id ${id} not found`);
        }

        const now = new Date();
        const updated: FinanceTransaction = {
            ...transaction,
            ...input,
            updatedAt: now,
            syncStatus: transaction.syncStatus === 'created' ? 'created' : 'updated',
        };

        try {
            return await db.transaction('rw', db.finance, db.wallets, async () => {
                await db.finance.put(updated);

                // Update wallet's updatedAt (only if walletId is valid)
                if (updated.walletId) {
                    const wallet = await db.wallets.get(updated.walletId);
                    if (wallet) {
                        await db.wallets.update(updated.walletId, {
                            updatedAt: now,
                            syncStatus: wallet.syncStatus === 'created' ? 'created' : 'updated'
                        });
                    }
                }

                return updated;
            });
        } catch (error) {
            console.error('Database error in update transaction:', error);
            throw error;
        }
    },

    async delete(id: string): Promise<void> {
        const transaction = await db.finance.get(id);
        if (transaction) {
            return db.transaction('rw', db.finance, db.wallets, db.syncQueue, async () => {
                // Queue Deletion
                await db.syncQueue.add({
                    id,
                    table: 'finance', // Use Dexie table name
                    action: 'delete',
                    createdAt: new Date()
                });

                await db.finance.delete(id);

                // Update wallet
                await db.wallets.update(transaction.walletId, {
                    updatedAt: new Date(),
                    // We don't necessarily update syncStatus of wallet just for transaction delete, 
                    // unless we want to bump timestamp. Let's do it to be safe.
                });
            });
        }
    },

    async markAsVisited(id: string): Promise<void> {
        await db.finance.update(id, {
            lastVisitedAt: new Date(),
        });
    },

    async getSummary(walletId?: string): Promise<FinanceSummary> {
        let transactions: FinanceTransaction[];
        if (walletId) {
            transactions = await db.finance.where('walletId').equals(walletId).toArray();
        } else {
            transactions = await db.finance.toArray();
        }

        // Hitung total dengan logika berbeda untuk Global vs Per-Wallet
        const isGlobal = !walletId;

        const totalIncome = transactions
            .filter(t => t.type === 'income')
            // Jika global summary, jangan hitung Transfer In sbg Income stat
            .filter(t => isGlobal ? t.category !== 'Transfer In' : true)
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = transactions
            .filter(t => t.type === 'expense')
            // Jika global summary, jangan hitung Transfer Out sbg Expense stat
            .filter(t => isGlobal ? t.category !== 'Transfer Out' : true)
            .reduce((sum, t) => sum + t.amount, 0);

        // Untuk Balance Real: KITA HARUS MENGHITUNG TRANSFER
        // Karena saldo fisik di dompet bertambah/berkurang karena transfer.
        // Tapi... tunggu. Untuk Global Balance:
        // Income Real - Expense Real = Net Change Real.
        // Transfer In (X) - Transfer Out (X) = 0.
        // Jadi Balance tidak terpengaruh jika kita exclude keduanya.
        // Kecuali... ada transfer antar user (belum support) atau transfer ke 'Other' yang tak terlacak.
        // Asumsi current system: Transfer selalu in-pair didalam system.

        // Tapi untuk amannya, Balance sebaiknya dihitung dari (IncomeAll - ExpenseAll) 
        // ATAU... Balance adalah penjumlahan saldo semua wallet.

        // Mari kita stick dengan definisi:
        // Summary.totalIncome -> Statistik Pemasukan Murni
        // Summary.totalExpense -> Statistik Pengeluaran Murni
        // Summary.balance -> Sisa uang (Net Worth)

        // Jika kita exclude transfer dari kedua sisi, Balance (Income-Expense) tetap VALID
        // karena +X dan -X dihilangkan.

        return {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            transactionCount: transactions.length,
        };
    },

    // --- TRANSFER ---
    async transferBetweenWallets(
        fromWalletId: string,
        toWalletId: string,
        amount: number,
        description?: string,
        date?: Date
    ): Promise<{ outTransaction: FinanceTransaction; inTransaction: FinanceTransaction }> {
        const now = new Date();
        const txDate = date || now;
        const outId = nanoid();
        const inId = nanoid();

        // Query wallet names untuk deskripsi
        const fromWallet = await db.wallets.get(fromWalletId);
        const toWallet = await db.wallets.get(toWalletId);

        const fromWalletName = fromWallet?.title || 'Unknown Wallet';
        const toWalletName = toWallet?.title || 'Unknown Wallet';

        const outTransaction: FinanceTransaction = {
            id: outId,
            walletId: fromWalletId,
            type: 'expense',
            amount,
            category: 'Transfer Out',
            description: description || `Transfer ke ${toWalletName}`,
            date: txDate,
            createdAt: now,
            updatedAt: now,
            linkedTransactionId: inId,
            linkedWalletId: toWalletId,
            syncStatus: 'created'
        };

        const inTransaction: FinanceTransaction = {
            id: inId,
            walletId: toWalletId,
            type: 'income',
            amount,
            category: 'Transfer In',
            description: description || `Transfer dari ${fromWalletName}`,
            date: txDate,
            createdAt: now,
            updatedAt: now,
            linkedTransactionId: outId,
            linkedWalletId: fromWalletId,
            syncStatus: 'created'
        };

        await db.transaction('rw', db.finance, db.wallets, async () => {
            await db.finance.bulkAdd([outTransaction, inTransaction]);

            // Mark wallets as updated
            if (fromWallet) await db.wallets.update(fromWalletId, { updatedAt: now, syncStatus: fromWallet.syncStatus === 'created' ? 'created' : 'updated' });
            if (toWallet) await db.wallets.update(toWalletId, { updatedAt: now, syncStatus: toWallet.syncStatus === 'created' ? 'created' : 'updated' });
        });

        return { outTransaction, inTransaction };
    },

    // --- BUDGETS ---
    async getAllBudgets(): Promise<Budget[]> {
        return await db.budgets.orderBy('createdAt').toArray();
    },

    async getBudgetById(id: string): Promise<Budget | undefined> {
        return await db.budgets.get(id);
    },

    async createBudget(input: CreateBudgetInput): Promise<Budget> {
        const now = new Date();
        const budget: Budget = {
            id: nanoid(),
            ...input,
            createdAt: now,
            updatedAt: now,
            syncStatus: 'created'
        };
        await db.budgets.add(budget);
        return budget;
    },

    async updateBudget(id: string, input: UpdateBudgetInput): Promise<Budget | undefined> {
        const budget = await db.budgets.get(id);
        if (!budget) return undefined;

        const updated: Budget = {
            ...budget,
            ...input,
            updatedAt: new Date(),
            syncStatus: budget.syncStatus === 'created' ? 'created' : 'updated'
        };

        await db.budgets.put(updated);
        return updated;
    },

    async deleteBudget(id: string): Promise<void> {
        return db.transaction('rw', db.budgets, db.budgetAssignments, db.syncQueue, async () => {
            // Queue Deletion
            await db.syncQueue.add({
                id,
                table: 'budgets',
                action: 'delete',
                createdAt: new Date()
            });

            // Delete local assignments (Cascade)
            await db.budgetAssignments.where('budgetId').equals(id).delete();
            // Delete budget
            await db.budgets.delete(id);
        });
    },

    async getBudgetSummary(budgetId: string, periodStart: Date, periodEnd: Date): Promise<BudgetSummary> {
        const budget = await db.budgets.get(budgetId);
        if (!budget) {
            throw new Error(`Budget dengan id ${budgetId} tidak ditemukan`);
        }

        // Get semua assignments untuk budget ini
        const assignments = await db.budgetAssignments.where('budgetId').equals(budgetId).toArray();
        const transactionIds = assignments.map(a => a.transactionId);

        // Get transactions yang di-assign dan filter by period
        const transactions = await db.finance.bulkGet(transactionIds);
        const filteredTransactions = transactions.filter(t => {
            if (!t) return false;
            const txDate = new Date(t.date);
            return txDate >= periodStart && txDate <= periodEnd;
        });

        const totalSpent = filteredTransactions
            .filter(t => t?.type === 'expense')
            .reduce((sum, t) => sum + (t?.amount || 0), 0);

        const transactionCount = filteredTransactions.length;
        const percentageUsed = budget.targetAmount > 0 ? (totalSpent / budget.targetAmount) * 100 : 0;
        const remainingAmount = budget.targetAmount - totalSpent;
        const isOverBudget = totalSpent > budget.targetAmount;

        return {
            budget,
            totalSpent,
            transactionCount,
            percentageUsed,
            remainingAmount,
            isOverBudget
        };
    },

    // --- BUDGET ASSIGNMENTS ---
    async assignTransactionToBudget(transactionId: string, budgetId: string): Promise<BudgetAssignment> {
        const existing = await db.budgetAssignments
            .where(['budgetId', 'transactionId'])
            .equals([budgetId, transactionId])
            .first();

        if (existing) {
            return existing;
        }

        const assignment: BudgetAssignment = {
            id: nanoid(),
            budgetId,
            transactionId,
            createdAt: new Date(),
            syncStatus: 'created'
        };

        await db.budgetAssignments.add(assignment);
        return assignment;
    },

    async unassignTransactionFromBudget(transactionId: string, budgetId: string): Promise<void> {
        return db.transaction('rw', db.budgetAssignments, db.syncQueue, async () => {
            // Find ID first to queue it
            const existing = await db.budgetAssignments
                .where(['budgetId', 'transactionId'])
                .equals([budgetId, transactionId])
                .first();

            if (existing) {
                await db.syncQueue.add({
                    id: existing.id,
                    table: 'budget_assignments',
                    action: 'delete',
                    createdAt: new Date()
                });

                await db.budgetAssignments.delete(existing.id);
            }
        });
    },

    async getAssignmentsForBudget(budgetId: string): Promise<BudgetAssignment[]> {
        return await db.budgetAssignments.where('budgetId').equals(budgetId).toArray();
    },

    async getAssignmentsForTransaction(transactionId: string): Promise<BudgetAssignment[]> {
        return await db.budgetAssignments.where('transactionId').equals(transactionId).toArray();
    }
};
