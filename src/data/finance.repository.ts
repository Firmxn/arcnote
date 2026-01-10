import { db } from './db';
import type {
    FinanceTransaction,
    FinanceAccount,
    CreateTransactionInput,
    UpdateTransactionInput,
    CreateAccountInput,
    UpdateAccountInput,
    FinanceSummary
} from '../types/finance';
import { nanoid } from 'nanoid';

export const financeRepository = {
    // --- ACCOUNTS ---

    /**
     * Get all finance accounts
     */
    async getAllAccounts(): Promise<FinanceAccount[]> {
        return await db.financeAccounts.orderBy('createdAt').toArray();
    },

    /**
     * Get account by ID
     */
    async getAccountById(id: string): Promise<FinanceAccount | undefined> {
        return await db.financeAccounts.get(id);
    },

    /**
     * Create new account
     */
    async createAccount(input: CreateAccountInput): Promise<FinanceAccount> {
        const now = new Date();
        const account: FinanceAccount = {
            id: nanoid(),
            ...input,
            createdAt: now,
            updatedAt: now,
        };
        await db.financeAccounts.add(account);
        return account;
    },

    /**
     * Update account
     */
    async updateAccount(id: string, input: UpdateAccountInput): Promise<FinanceAccount | undefined> {
        const account = await db.financeAccounts.get(id);
        if (!account) return undefined;

        const updated: FinanceAccount = {
            ...account,
            ...input,
            updatedAt: new Date(),
        };

        await db.financeAccounts.update(id, updated);
        return updated;
    },

    /**
     * Delete account and its transactions
     */
    async deleteAccount(id: string): Promise<void> {
        return db.transaction('rw', db.financeAccounts, db.finance, async () => {
            // Delete all transactions for this account
            await db.finance.where('accountId').equals(id).delete();
            // Delete the account
            await db.financeAccounts.delete(id);
        });
    },

    async markAccountAsVisited(id: string): Promise<void> {
        await db.financeAccounts.update(id, { lastVisitedAt: new Date() });
    },

    // --- TRANSACTIONS ---

    /**
     * Mengambil transaksi (opsional filter by accountId)
     */
    async getAll(accountId?: string): Promise<FinanceTransaction[]> {
        if (accountId) {
            return await db.finance
                .where('accountId')
                .equals(accountId)
                .reverse()
                .sortBy('date');
        }
        return await db.finance.orderBy('date').reverse().toArray();
    },

    /**
     * Mengambil transaksi berdasarkan ID
     */
    async getById(id: string): Promise<FinanceTransaction | undefined> {
        return await db.finance.get(id);
    },

    /**
     * Membuat transaksi baru
     */
    async create(input: CreateTransactionInput): Promise<FinanceTransaction> {
        const now = new Date();
        // Ensure accountId is present (it should be in input from Types)

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
    async getSummary(accountId?: string): Promise<FinanceSummary> {
        let transactions: FinanceTransaction[];

        if (accountId) {
            transactions = await db.finance.where('accountId').equals(accountId).toArray();
        } else {
            transactions = await db.finance.toArray();
        }

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
