/**
 * Finance Repository
 * Data access layer untuk Finance (Wallets & Transactions)
 * Supports switching between Local (IndexedDB) and Backend (Supabase)
 */
import { db } from './db';
import type {
    FinanceTransaction,
    Wallet,
    CreateTransactionInput,
    UpdateTransactionInput,
    CreateWalletInput,
    UpdateWalletInput,
    FinanceSummary
} from '../types/finance';
import { nanoid } from 'nanoid';
import { supabase } from './supabase';

/**
 * Interface Repository
 */
interface FinanceRepo {
    // --- WALLETS ---
    getAllWallets(): Promise<Wallet[]>;
    getWalletById(id: string): Promise<Wallet | undefined>;
    createWallet(input: CreateWalletInput): Promise<Wallet>;
    updateWallet(id: string, input: UpdateWalletInput): Promise<Wallet | undefined>;
    deleteWallet(id: string): Promise<void>;
    markWalletAsVisited(id: string): Promise<void>;

    // --- TRANSACTIONS ---
    getAll(walletId?: string): Promise<FinanceTransaction[]>;
    getById(id: string): Promise<FinanceTransaction | undefined>;
    create(input: CreateTransactionInput): Promise<FinanceTransaction>;
    update(id: string, input: UpdateTransactionInput): Promise<FinanceTransaction | undefined>;
    delete(id: string): Promise<void>;
    markAsVisited(id: string): Promise<void>;
    getSummary(walletId?: string): Promise<FinanceSummary>;

    // --- TRANSFER ---
    transferBetweenWallets(fromWalletId: string, toWalletId: string, amount: number, description?: string, date?: Date): Promise<{ outTransaction: FinanceTransaction; inTransaction: FinanceTransaction }>;
}

/**
 * Local Implementation (IndexedDB)
 */
export const localFinanceRepository = {
    async getAllWallets(): Promise<Wallet[]> {
        return await db.wallets.orderBy('createdAt').toArray();
    },

    async getWalletById(id: string): Promise<Wallet | undefined> {
        return await db.wallets.get(id);
    },

    async createWallet(input: CreateWalletInput): Promise<Wallet> {
        const now = new Date();
        const wallet: Wallet = {
            id: nanoid(),
            ...input,
            createdAt: now,
            updatedAt: now,
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
        };

        await db.wallets.update(id, updated);
        return updated;
    },

    async deleteWallet(id: string): Promise<void> {
        return db.transaction('rw', db.wallets, db.finance, async () => {
            await db.finance.where('walletId').equals(id).delete();
            await db.wallets.delete(id);
        });
    },

    async markWalletAsVisited(id: string): Promise<void> {
        await db.wallets.update(id, { lastVisitedAt: new Date() });
    },

    async getAll(walletId?: string): Promise<FinanceTransaction[]> {
        if (walletId) {
            return await db.finance
                .where('walletId')
                .equals(walletId)
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

        // Update wallet's updatedAt
        await db.wallets.update(input.walletId, { updatedAt: now });

        return transaction;
    },

    async update(id: string, input: UpdateTransactionInput): Promise<FinanceTransaction | undefined> {
        const transaction = await db.finance.get(id);
        if (!transaction) return undefined;

        const now = new Date();
        const updated: FinanceTransaction = {
            ...transaction,
            ...input,
            updatedAt: now,
        };

        await db.finance.update(id, updated);

        // Update wallet's updatedAt
        await db.wallets.update(transaction.walletId, { updatedAt: now });

        return updated;
    },

    async delete(id: string): Promise<void> {
        const transaction = await db.finance.get(id);
        if (transaction) {
            await db.finance.delete(id);
            // Update wallet's updatedAt
            await db.wallets.update(transaction.walletId, { updatedAt: new Date() });
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

    async syncWallet(wallet: Wallet, transactions: FinanceTransaction[] = []): Promise<void> {
        await db.wallets.put(wallet);
        if (transactions.length > 0) {
            await db.finance.bulkPut(transactions);
        }
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

        // Transaksi keluar (expense) dari wallet sumber
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
        };

        // Transaksi masuk (income) ke wallet tujuan
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
        };

        // Simpan kedua transaksi dalam satu batch
        await db.finance.bulkAdd([outTransaction, inTransaction]);

        return { outTransaction, inTransaction };
    }
};

/**
 * Backend Implementation (Supabase)
 */
export const backendFinanceRepository = {
    // --- WALLETS ---
    async getAllWallets(): Promise<Wallet[]> {
        const { data, error } = await supabase
            .from('wallets') // Updated table name
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

    async getWalletById(id: string): Promise<Wallet | undefined> {
        const { data, error } = await supabase
            .from('wallets')
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

    async createWallet(input: CreateWalletInput): Promise<Wallet> {
        const now = new Date();
        const newWallet = {
            id: nanoid(),
            ...input,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString()
        };

        const { data, error } = await supabase
            .from('wallets')
            .insert(newWallet)
            .select()
            .single();

        if (error) throw error;

        return {
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
        };
    },

    async updateWallet(id: string, input: UpdateWalletInput): Promise<Wallet | undefined> {
        const updateData = {
            ...input,
            updatedAt: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('wallets')
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

    async deleteWallet(id: string): Promise<void> {
        // Assume Cascade delete is configured in Postgres for transactions!
        // If not, we trigger delete manually.

        // 1. Delete transactions
        await supabase.from('finance_transactions').delete().eq('walletId', id);

        // 2. Delete wallet
        const { error } = await supabase.from('wallets').delete().eq('id', id);
        if (error) throw error;
    },

    async markWalletAsVisited(id: string): Promise<void> {
        await supabase
            .from('wallets')
            .update({ lastVisitedAt: new Date().toISOString() })
            .eq('id', id);
    },

    // --- TRANSACTIONS ---
    async getAll(walletId?: string): Promise<FinanceTransaction[]> {
        let query = supabase
            .from('finance_transactions')
            .select('*')
            .order('date', { ascending: false }); // Latest first

        if (walletId) {
            query = query.eq('walletId', walletId);
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
        };

        const { data, error } = await supabase
            .from('finance_transactions')
            .insert(newTransaction)
            .select()
            .single();

        if (error) throw error;

        // Update wallet's updatedAt
        await supabase
            .from('wallets')
            .update({ updatedAt: now.toISOString() })
            .eq('id', input.walletId);

        return { ...data, date: new Date(data.date), createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt) };
    },

    async update(id: string, input: UpdateTransactionInput): Promise<FinanceTransaction | undefined> {
        const now = new Date();
        const updateData = {
            ...input,
            updatedAt: now.toISOString()
        };

        const { data, error } = await supabase
            .from('finance_transactions')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Update wallet's updatedAt
        await supabase
            .from('wallets')
            .update({ updatedAt: now.toISOString() })
            .eq('id', data.walletId);

        return { ...data, date: new Date(data.date), createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt) };
    },

    async delete(id: string): Promise<void> {
        // Get transaction first to know which wallet to update
        const { data: transaction } = await supabase
            .from('finance_transactions')
            .select('walletId')
            .eq('id', id)
            .single();

        const { error } = await supabase
            .from('finance_transactions')
            .delete()
            .eq('id', id);
        if (error) throw error;

        // Update wallet's updatedAt
        if (transaction) {
            await supabase
                .from('wallets')
                .update({ updatedAt: new Date().toISOString() })
                .eq('id', transaction.walletId);
        }
    },

    async markAsVisited(id: string): Promise<void> {
        await supabase
            .from('finance_transactions')
            .update({ lastVisitedAt: new Date().toISOString() })
            .eq('id', id);
    },

    async getSummary(walletId?: string): Promise<FinanceSummary> {
        // Calculate via client-side sum for now (MVP phase 2)
        // Select only necessary columns
        let query = supabase.from('finance_transactions').select('amount, type');
        if (walletId) {
            query = query.eq('walletId', walletId);
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
    },

    // --- SYNC METHODS ---
    async syncWallet(wallet: Wallet, transactions: FinanceTransaction[] = []): Promise<void> {
        // 1. Upsert Wallet
        const walletPayload = {
            ...wallet,
            createdAt: wallet.createdAt.toISOString(),
            updatedAt: wallet.updatedAt.toISOString(),
            lastVisitedAt: wallet.lastVisitedAt?.toISOString()
        };
        const { error: walletError } = await supabase.from('wallets').upsert(walletPayload);
        if (walletError) throw walletError;

        // 2. Upsert Transactions
        if (transactions.length > 0) {
            const txPayloads = transactions.map(t => ({
                ...t,
                date: t.date.toISOString(),
                createdAt: t.createdAt.toISOString(),
                updatedAt: t.updatedAt.toISOString(),
                lastVisitedAt: t.lastVisitedAt?.toISOString()
            }));
            const { error: txError } = await supabase.from('finance_transactions').upsert(txPayloads);
            if (txError) throw txError;
        }
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
        const { data: fromWallet } = await supabase
            .from('wallets')
            .select('title')
            .eq('id', fromWalletId)
            .single();

        const { data: toWallet } = await supabase
            .from('wallets')
            .select('title')
            .eq('id', toWalletId)
            .single();

        const fromWalletName = fromWallet?.title || 'Unknown Wallet';
        const toWalletName = toWallet?.title || 'Unknown Wallet';

        // Transaksi keluar (expense) dari wallet sumber
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
        };

        // Transaksi masuk (income) ke wallet tujuan
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
        };

        // Insert ke Supabase
        const payloads = [outTransaction, inTransaction].map(t => ({
            ...t,
            date: t.date.toISOString(),
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString(),
        }));

        console.log('Transfer payloads:', payloads);

        const { data, error } = await supabase
            .from('finance_transactions')
            .insert(payloads)
            .select();

        if (error) {
            console.error('Transfer error:', error);
            throw error;
        }

        console.log('Transfer success:', data);

        return { outTransaction, inTransaction };
    }
};

const getRepo = (): FinanceRepo => {
    const pref = localStorage.getItem('arcnote_storage_preference');
    return pref === 'backend' ? backendFinanceRepository : localFinanceRepository;
};

export const financeRepository: FinanceRepo = {
    getAllWallets: () => getRepo().getAllWallets(),
    getWalletById: (id) => getRepo().getWalletById(id),
    createWallet: (input) => getRepo().createWallet(input),
    updateWallet: (id, input) => getRepo().updateWallet(id, input),
    deleteWallet: (id) => getRepo().deleteWallet(id),
    markWalletAsVisited: (id) => getRepo().markWalletAsVisited(id),

    getAll: (walletId) => getRepo().getAll(walletId),
    getById: (id) => getRepo().getById(id),
    create: (input) => getRepo().create(input),
    update: (id, input) => getRepo().update(id, input),
    delete: (id) => getRepo().delete(id),
    markAsVisited: (id) => getRepo().markAsVisited(id),
    getSummary: (walletId) => getRepo().getSummary(walletId),
    transferBetweenWallets: (fromWalletId, toWalletId, amount, description, date) =>
        getRepo().transferBetweenWallets(fromWalletId, toWalletId, amount, description, date),
};
