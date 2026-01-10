/**
 * Dexie Database Configuration
 * Setup IndexedDB untuk ArcNote
 */

import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Page } from '../types/page';
import type { Block } from '../types/block';
import type { ScheduleEvent } from '../types/schedule';
import type { FinanceTransaction, FinanceAccount } from '../types/finance';

export class ArcNoteDatabase extends Dexie {
    pages!: Table<Page, string>;
    blocks!: Table<Block, string>;
    schedules!: Table<ScheduleEvent, string>;
    finance!: Table<FinanceTransaction, string>;
    financeAccounts!: Table<FinanceAccount, string>;

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
                // Create Default Account
                const defaultAccount: FinanceAccount = {
                    id: 'default',
                    title: 'Main Wallet',
                    description: 'Default account',
                    currency: 'IDR',
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                await accountsTable.add(defaultAccount);

                // Assign accountId to existng transactions
                await financeTable.toCollection().modify({ accountId: 'default' });
            }
        });
    }
}


// Export singleton instance
export const db = new ArcNoteDatabase();
