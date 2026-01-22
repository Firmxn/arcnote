/**
 * Dexie Database Configuration
 * Setup IndexedDB untuk ArcNote
 */

import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Page } from '../types/page';
import type { Block } from '../types/block';
import type { ScheduleEvent } from '../types/schedule';
import type { FinanceTransaction, Wallet } from '../types/finance';

export class ArcNoteDatabase extends Dexie {
    pages!: Table<Page, string>;
    blocks!: Table<Block, string>;
    schedules!: Table<ScheduleEvent, string>;
    finance!: Table<FinanceTransaction, string>;
    wallets!: Table<Wallet, string>;

    constructor() {
        super('ArcNoteDB');

        this.version(1).stores({
            pages: 'id, title, createdAt, updatedAt',
            blocks: 'id, pageId, type, order, createdAt, updatedAt'
        });

        // Version 2: Add parentId to pages for nested pages support
        this.version(2).stores({
            pages: 'id, title, parentId, createdAt, updatedAt'
        });

        // Version 3: Add schedules table
        this.version(3).stores({
            schedules: 'id, title, date, isAllDay, createdAt, updatedAt'
        });

        // Version 4: Add type index to schedules
        this.version(4).stores({
            schedules: 'id, title, date, type, isAllDay, createdAt, updatedAt'
        });

        // Version 5: Add finance table
        this.version(5).stores({
            finance: 'id, type, category, date, amount, createdAt, updatedAt'
        });

        // Version 6: Add financeAccounts and update finance with accountId
        this.version(6).stores({
            financeAccounts: 'id, title, createdAt, updatedAt',
            finance: 'id, accountId, type, category, date, amount, createdAt, updatedAt'
        }).upgrade(async trans => {
            // Migration: Assign existing transactions to default account
            const financeTable = trans.table('finance');
            const accountsTable = trans.table('financeAccounts');

            const count = await financeTable.count();
            if (count > 0) {
                // Create Default Account (using old type for migration compatibility)
                const defaultAccount: any = {
                    id: 'default',
                    title: 'Main Wallet',
                    description: 'Default account',
                    currency: 'IDR',
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                await accountsTable.add(defaultAccount);

                // Assign accountId to existing transactions
                await financeTable.toCollection().modify({ accountId: 'default' });
            }
        });

        // Version 7: Add isArchived support
        this.version(7).stores({
            pages: 'id, title, parentId, isArchived, createdAt, updatedAt',
            schedules: 'id, title, date, type, isAllDay, isArchived, createdAt, updatedAt',
            financeAccounts: 'id, title, isArchived, createdAt, updatedAt'
        });

        // Version 8: Rename financeAccounts → wallets, accountId → walletId
        this.version(8).stores({
            wallets: 'id, title, isArchived, createdAt, updatedAt',
            finance: 'id, walletId, type, category, date, amount, createdAt, updatedAt',
            financeAccounts: null // Delete old table
        }).upgrade(async trans => {
            // Migration: Copy data from financeAccounts to wallets
            const oldAccountsTable = trans.table('financeAccounts');
            const newWalletsTable = trans.table('wallets');
            const financeTable = trans.table('finance');

            // Copy all accounts to wallets table
            const accounts = await oldAccountsTable.toArray();
            await newWalletsTable.bulkAdd(accounts);

            // Rename accountId → walletId in transactions
            const transactions = await financeTable.toArray();
            await financeTable.clear();

            const updatedTransactions = transactions.map((t: any) => ({
                ...t,
                walletId: t.accountId,
                accountId: undefined
            }));

            await financeTable.bulkAdd(updatedTransactions);
        });
    }
}


// Export singleton instance
export const db = new ArcNoteDatabase();
