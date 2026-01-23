/**
 * Schedules Repository (Unified Local-First)
 *
 * Architecture:
 * - Reads: Always from Local DB (Dexie)
 * - Writes: Update Local DB + Set Sync Flag
 * - Deletes: Delete Local DB + Add to Sync Queue
 */
import { db } from './db';
import type { ScheduleEvent, CreateEventInput, UpdateEventInput } from '../types/schedule';
import { nanoid } from 'nanoid';

interface SchedulesRepo {
    getAll(): Promise<ScheduleEvent[]>;
    create(input: CreateEventInput): Promise<ScheduleEvent>;
    update(id: string, input: UpdateEventInput): Promise<void>;
    delete(id: string): Promise<void>;
    markAsVisited(id: string): Promise<void>;
}

export const schedulesRepository: SchedulesRepo = {
    async getAll(): Promise<ScheduleEvent[]> {
        return await db.schedules.orderBy('date').toArray();
    },

    async create(input: CreateEventInput): Promise<ScheduleEvent> {
        const event: ScheduleEvent = {
            id: nanoid(),
            ...input,
            createdAt: new Date(),
            updatedAt: new Date(),
            syncStatus: 'created', // Sync Flag
        };
        await db.schedules.add(event);
        return event;
    },

    async update(id: string, input: UpdateEventInput): Promise<void> {
        const event = await db.schedules.get(id);
        if (!event) return;

        await db.schedules.update(id, {
            ...input,
            updatedAt: new Date(),
            syncStatus: event.syncStatus === 'created' ? 'created' : 'updated', // Keep 'created' if strictly local
        });
    },

    async delete(id: string): Promise<void> {
        return db.transaction('rw', db.schedules, db.syncQueue, async () => {
            // Queue Deletion
            await db.syncQueue.add({
                id,
                table: 'schedules',
                action: 'delete',
                createdAt: new Date()
            });

            await db.schedules.delete(id);
        });
    },

    async markAsVisited(id: string): Promise<void> {
        // Optional: Sync this? Maybe not critical, but let's do it for consistency
        await db.schedules.update(id, {
            lastVisitedAt: new Date(),
            // syncStatus: Not updating syncStatus to avoid spamming updates for just 'visit'
            // or we can update it if we want "Recently Visited" to sync across devices.
            // Let's Skip syncing visit time for now to save bandwidth.
        });
    }
};
