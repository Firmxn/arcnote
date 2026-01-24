/**
 * Blocks Repository (Unified Local-First)
 *
 * Architecture:
 * - Reads: Always from Local DB (Dexie)
 * - Writes: Update Local DB + Set Sync Flag
 * - Deletes: Delete Local DB + Add to Sync Queue
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
            syncStatus: 'created'
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
            syncStatus: block.syncStatus === 'created' ? 'created' : 'updated'
        };

        await db.blocks.update(id, updated);
        return updated;
    },

    /**
     * Hapus block
     */
    async delete(id: string): Promise<void> {
        return db.transaction('rw', db.blocks, db.syncQueue, async () => {
            // Queue Deletion
            await db.syncQueue.add({
                id,
                table: 'blocks',
                action: 'delete',
                createdAt: new Date()
            });

            await db.blocks.delete(id);
        });
    },

    /**
     * Hapus semua blocks untuk page tertentu
     * Note: Biasanya dipanggil saat delete Page. 
     * Jika Delete Page sudah di-queue, ini hanya cleanup lokal.
     * Jika dipanggil independen, kita harus queue semua block IDs?
     * Asumsi: Method ini jarang dipanggil langsung oleh UI kecuali "Clear Content".
     * Jika Clear Content, maka Loop delete queue.
     */
    async deleteByPageId(pageId: string): Promise<void> {
        const blocks = await db.blocks.where('pageId').equals(pageId).toArray();
        if (blocks.length === 0) return;

        return db.transaction('rw', db.blocks, db.syncQueue, async () => {
            // Queue Deletions for all blocks
            const queueItems = blocks.map(b => ({
                id: b.id,
                table: 'blocks',
                action: 'delete' as const,
                createdAt: new Date()
            }));
            await db.syncQueue.bulkAdd(queueItems);

            await db.blocks.where('pageId').equals(pageId).delete();
        });
    },
};
