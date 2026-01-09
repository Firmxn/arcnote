/**
 * Dexie Database Configuration
 * Setup IndexedDB untuk ArcNote
 */

import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Page } from '../types/page';
import type { Block } from '../types/block';

export class ArcNoteDatabase extends Dexie {
    pages!: Table<Page, string>;
    blocks!: Table<Block, string>;

    constructor() {
        super('ArcNoteDB');

        this.version(1).stores({
            pages: 'id, title, createdAt, updatedAt',
            blocks: 'id, pageId, type, order, createdAt, updatedAt'
        });
    }
}

// Export singleton instance
export const db = new ArcNoteDatabase();
