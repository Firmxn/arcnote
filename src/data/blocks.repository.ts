/**
 * Blocks Repository
 * Data access layer untuk Blocks
 */

import { db } from './db';
import type { Block, CreateBlockInput, UpdateBlockInput } from '../types/block';
import { nanoid } from 'nanoid';

export const blocksRepository = {
    /**
     * Mengambil semua blocks untuk page tertentu
     */
    async getByPageId(pageId: string): Promise<Block[]> {
        return await db.blocks
            .where('pageId')
            .equals(pageId)
            .sortBy('order');
    },

    /**
     * Mengambil block berdasarkan ID
     */
    async getById(id: string): Promise<Block | undefined> {
        return await db.blocks.get(id);
    },

    /**
     * Membuat block baru
     */
    async create(input: CreateBlockInput): Promise<Block> {
        const now = new Date();
        const block: Block = {
            id: nanoid(),
            ...input,
            createdAt: now,
            updatedAt: now,
        };

        await db.blocks.add(block);
        return block;
    },

    /**
     * Update block
     */
    async update(id: string, input: UpdateBlockInput): Promise<Block | undefined> {
        const block = await db.blocks.get(id);
        if (!block) return undefined;

        const updated: Block = {
            ...block,
            ...input,
            updatedAt: new Date(),
        };

        await db.blocks.update(id, updated);
        return updated;
    },

    /**
     * Hapus block
     */
    async delete(id: string): Promise<void> {
        await db.blocks.delete(id);
    },

    /**
     * Hapus semua blocks untuk page tertentu
     */
    async deleteByPageId(pageId: string): Promise<void> {
        await db.blocks.where('pageId').equals(pageId).delete();
    },
};
