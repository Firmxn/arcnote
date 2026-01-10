/**
 * Finance Repository
 * Data access layer untuk Finance (Accounts & Transactions)
 * Supports switching between Local (IndexedDB) and Backend (Supabase)
 */
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
import { supabase } from './supabase';

/**
 * Interface Repository
 */
interface FinanceRepo {
    // --- ACCOUNTS ---
    getAllAccounts(): Promise<FinanceAccount[]>;
    getAccountById(id: string): Promise<FinanceAccount | undefined>;
    createAccount(input: CreateAccountInput): Promise<FinanceAccount>;
    updateAccount(id: string, input: UpdateAccountInput): Promise<FinanceAccount | undefined>;
    deleteAccount(id: string): Promise<void>;
    markAccountAsVisited(id: string): Promise<void>;

    // --- TRANSACTIONS ---
    getAll(accountId?: string): Promise<FinanceTransaction[]>;
    getById(id: string): Promise<FinanceTransaction | undefined>;
    create(input: CreateTransactionInput): Promise<FinanceTransaction>;
    update(id: string, input: UpdateTransactionInput): Promise<FinanceTransaction | undefined>;
    delete(id: string): Promise<void>;
    markAsVisited(id: string): Promise<void>;
    getSummary(accountId?: string): Promise<FinanceSummary>;
}

/**
 * Local Implementation (IndexedDB)
 */
const localRepository: FinanceRepo = {
    async getAllAccounts(): Promise<FinanceAccount[]> {
        return await db.financeAccounts.orderBy('createdAt').toArray();
    },

    async getAccountById(id: string): Promise<FinanceAccount | undefined> {
        return await db.financeAccounts.get(id);
    },

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

    async deleteAccount(id: string): Promise<void> {
        return db.transaction('rw', db.financeAccounts, db.finance, async () => {
            await db.finance.where('accountId').equals(id).delete();
            await db.financeAccounts.delete(id);
        });
    },

    async markAccountAsVisited(id: string): Promise<void> {
        await db.financeAccounts.update(id, { lastVisitedAt: new Date() });
    },

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

    async getById(id: string): Promise<FinanceTransaction | undefined> {
        return await db.finance.get(id);
    },

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

    async delete(id: string): Promise<void> {
        await db.finance.delete(id);
    },

    async markAsVisited(id: string): Promise<void> {
        await db.finance.update(id, {
            lastVisitedAt: new Date(),
        });
    },

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

/**
 * Backend Implementation (Supabase)
 */
const backendRepository: FinanceRepo = {
    // --- ACCOUNTS ---
    async getAllAccounts(): Promise<FinanceAccount[]> {
        const { data, error } = await supabase
            .from('finance_accounts') // Expect snake_case table name or match
            .select('*')
            .order('createdAt', { ascending: true });

        if (error) {
            console.error('Supabase Error:', error);
            return [];
        }

        return data.map(a => ({
            ...a,
            createdAt: new Date(a.createdAt),
            updatedAt: new Date(a.updatedAt),
            lastVisitedAt: a.lastVisitedAt ? new Date(a.lastVisitedAt) : undefined
        }));
    },

    async getAccountById(id: string): Promise<FinanceAccount | undefined> {
        const { data, error } = await supabase
            .from('finance_accounts')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return undefined;

        return {
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            lastVisitedAt: data.lastVisitedAt ? new Date(data.lastVisitedAt) : undefined
        };
    },

    async createAccount(input: CreateAccountInput): Promise<FinanceAccount> {
        const now = new Date();
        const newAccount = {
            id: nanoid(),
            ...input,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString()
        };

        const { data, error } = await supabase
            .from('finance_accounts')
            .insert(newAccount)
            .select()
            .single();

        if (error) throw error;

        return {
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
        };
    },

    async updateAccount(id: string, input: UpdateAccountInput): Promise<FinanceAccount | undefined> {
        const updateData = {
            ...input,
            updatedAt: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('finance_accounts')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
        };
    },

    async deleteAccount(id: string): Promise<void> {
        // Assume Cascade delete is configured in Postgres for transactions!
        // If not, we trigger delete manually.

        // 1. Delete transactions
        await supabase.from('finance_transactions').delete().eq('accountId', id);

        // 2. Delete account
        const { error } = await supabase.from('finance_accounts').delete().eq('id', id);
        if (error) throw error;
    },

    async markAccountAsVisited(id: string): Promise<void> {
        await supabase
            .from('finance_accounts')
            .update({ lastVisitedAt: new Date().toISOString() })
            .eq('id', id);
    },

    // --- TRANSACTIONS ---
    async getAll(accountId?: string): Promise<FinanceTransaction[]> {
        let query = supabase
            .from('finance_transactions')
            .select('*')
            .order('date', { ascending: false }); // Latest first

        if (accountId) {
            query = query.eq('accountId', accountId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Supabase Error:', error);
            return [];
        }

        return data.map(t => ({
            ...t,
            date: new Date(t.date),
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt),
            lastVisitedAt: t.lastVisitedAt ? new Date(t.lastVisitedAt) : undefined
        }));
    },

    async getById(id: string): Promise<FinanceTransaction | undefined> {
        const { data, error } = await supabase
            .from('finance_transactions')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return undefined;
        return { ...data, date: new Date(data.date), createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt) };
    },

    async create(input: CreateTransactionInput): Promise<FinanceTransaction> {
        const now = new Date();
        const newTransaction = {
            id: nanoid(),
            ...input,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString()
            // input.date is Date? Supabase needs string.
            // But createClient handles Date -> String usually. Let's explicitly convert input.date?.toISOString() if needed.
            // To match local repo, input usually has date object.
        };

        const { data, error } = await supabase
            .from('finance_transactions')
            .insert(newTransaction)
            .select()
            .single();

        if (error) throw error;
        return { ...data, date: new Date(data.date), createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt) };
    },

    async update(id: string, input: UpdateTransactionInput): Promise<FinanceTransaction | undefined> {
        const updateData = {
            ...input,
            updatedAt: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('finance_transactions')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { ...data, date: new Date(data.date), createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt) };
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('finance_transactions')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async markAsVisited(id: string): Promise<void> {
        await supabase
            .from('finance_transactions')
            .update({ lastVisitedAt: new Date().toISOString() })
            .eq('id', id);
    },

    async getSummary(accountId?: string): Promise<FinanceSummary> {
        // Calculate via client-side sum for now (MVP phase 2)
        // Select only necessary columns
        let query = supabase.from('finance_transactions').select('amount, type');
        if (accountId) {
            query = query.eq('accountId', accountId);
        }

        const { data, error } = await query;
        if (error || !data) {
            return { totalIncome: 0, totalExpense: 0, balance: 0, transactionCount: 0 };
        }

        const totalIncome = data
            .filter((t: any) => t.type === 'income')
            .reduce((sum, t: any) => sum + t.amount, 0);

        const totalExpense = data
            .filter((t: any) => t.type === 'expense')
            .reduce((sum, t: any) => sum + t.amount, 0);

        return {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            transactionCount: data.length,
        };
    }
};

const getRepo = (): FinanceRepo => {
    const pref = localStorage.getItem('arcnote_storage_preference');
    return pref === 'backend' ? backendRepository : localRepository;
};

export const financeRepository: FinanceRepo = {
    getAllAccounts: () => getRepo().getAllAccounts(),
    getAccountById: (id) => getRepo().getAccountById(id),
    createAccount: (input) => getRepo().createAccount(input),
    updateAccount: (id, input) => getRepo().updateAccount(id, input),
    deleteAccount: (id) => getRepo().deleteAccount(id),
    markAccountAsVisited: (id) => getRepo().markAccountAsVisited(id),

    getAll: (accId) => getRepo().getAll(accId),
    getById: (id) => getRepo().getById(id),
    create: (input) => getRepo().create(input),
    update: (id, input) => getRepo().update(id, input),
    delete: (id) => getRepo().delete(id),
    markAsVisited: (id) => getRepo().markAsVisited(id),
    getSummary: (accId) => getRepo().getSummary(accId),
};
