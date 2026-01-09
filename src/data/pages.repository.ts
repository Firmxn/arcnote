/**
 * Pages Repository
 * Data access layer untuk Pages
 */

import { db } from './db';
import type { Page, CreatePageInput, UpdatePageInput } from '../types/page';
import { nanoid } from 'nanoid';

export const pagesRepository = {
    /**
     * Mengambil semua pages
     */
    async getAll(): Promise<Page[]> {
        return await db.pages.orderBy('updatedAt').reverse().toArray();
    },

    /**
     * Mengambil page berdasarkan ID
     */
    async getById(id: string): Promise<Page | undefined> {
        return await db.pages.get(id);
    },

    /**
     * Membuat page baru
     */
    async create(input: CreatePageInput): Promise<Page> {
        const now = new Date();
        const page: Page = {
            id: nanoid(),
            ...input,
            createdAt: now,
            updatedAt: now,
        };

        await db.pages.add(page);
        return page;
    },

    /**
     * Update page
     */
    async update(id: string, input: UpdatePageInput): Promise<Page | undefined> {
        const page = await db.pages.get(id);
        if (!page) return undefined;

        const updated: Page = {
            ...page,
            ...input,
            updatedAt: new Date(),
        };

        await db.pages.update(id, updated);
        return updated;
    },

    /**
     * Hapus page
     */
    async delete(id: string): Promise<void> {
        await db.pages.delete(id);
    },
};
