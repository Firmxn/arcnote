/**
 * Dexie Database Configuration
 * Setup IndexedDB untuk ArcNote
 */

import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Page } from '../types/page';
import type { Block } from '../types/block';
import type { ScheduleEvent } from '../types/schedule';
import type { FinanceTransaction } from '../types/finance';

export class ArcNoteDatabase extends Dexie {
    pages!: Table<Page, string>;
    blocks!: Table<Block, string>;
    schedules!: Table<ScheduleEvent, string>;
    finance!: Table<FinanceTransaction, string>;

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
    }
}


// Export singleton instance
export const db = new ArcNoteDatabase();
