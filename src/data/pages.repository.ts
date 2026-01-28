/**
 * Pages Repository (Unified Local-First)
 *
 * Architecture:
 * - Reads: Always from Local DB (Dexie)
 * - Writes: Update Local DB + Set Sync Flag
 * - Deletes: Delete Local DB + Add to Sync Queue
 */

import { db } from './db';
import type { Page, CreatePageInput, UpdatePageInput } from '../types/page';
import { nanoid } from 'nanoid';

/**
 * Interface Repository
 */
interface PagesRepo {
    getAll(): Promise<Page[]>;
    getById(id: string): Promise<Page | undefined>;
    create(input: CreatePageInput): Promise<Page>;
    update(id: string, input: UpdatePageInput): Promise<Page | undefined>;
    delete(id: string): Promise<void>;
    markAsVisited(id: string): Promise<void>;
}

export const pagesRepository: PagesRepo = {
    async getAll(): Promise<Page[]> {
        return await db.pages.orderBy('updatedAt').reverse().toArray();
    },

    async getById(id: string): Promise<Page | undefined> {
        return await db.pages.get(id);
    },

    async create(input: CreatePageInput): Promise<Page> {
        const now = new Date();
        const page: Page = {
            id: nanoid(),
            ...input,
            createdAt: now,
            updatedAt: now,
            syncStatus: 'created'
        };

        await db.pages.add(page);
        return page;
    },

    async update(id: string, input: UpdatePageInput): Promise<Page | undefined> {
        const page = await db.pages.get(id);
        if (!page) return undefined;

        const updated: Page = {
            ...page,
            ...input,
            updatedAt: new Date(),
            syncStatus: page.syncStatus === 'created' ? 'created' : 'updated'
        };

        await db.pages.update(id, updated as any);
        return updated;
    },

    async delete(id: string): Promise<void> {
        return db.transaction('rw', db.pages, db.blocks, db.syncQueue, async () => {
            // Queue Page Deletion
            await db.syncQueue.add({
                id,
                table: 'pages',
                action: 'delete',
                createdAt: new Date()
            });

            // Delete blocks locally (Manual Cleanup)
            await db.blocks.where('pageId').equals(id).delete();
            // Delete page
            await db.pages.delete(id);
        });
    },

    async markAsVisited(id: string): Promise<void> {
        await db.pages.update(id, {
            lastVisitedAt: new Date(),
        });
    }
};
