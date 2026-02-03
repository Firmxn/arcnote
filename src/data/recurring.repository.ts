/**
 * Recurring Template Repository
 */

import { db } from './db';
import type { RecurringTemplate } from '../types/finance';
import { nanoid } from 'nanoid';

interface RecurringRepo {
    getAll(): Promise<RecurringTemplate[]>;
    getActiveDue(date?: Date): Promise<RecurringTemplate[]>;
    create(template: Omit<RecurringTemplate, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<RecurringTemplate>;
    update(id: string, updates: Partial<RecurringTemplate>): Promise<void>;
    delete(id: string): Promise<void>;
}

export const recurringRepository: RecurringRepo = {
    async getAll(): Promise<RecurringTemplate[]> {
        return await db.recurringTemplates.orderBy('createdAt').toArray();
    },

    /**
     * Get active templates where nextRunDate <= date
     */
    async getActiveDue(date: Date = new Date()): Promise<RecurringTemplate[]> {
        return await db.recurringTemplates
            .where('nextRunDate')
            .belowOrEqual(date)
            .filter(t => t.isActive === true)
            .toArray();
    },

    async create(input): Promise<RecurringTemplate> {
        const now = new Date();
        const template: RecurringTemplate = {
            id: nanoid(),
            ...input,
            createdAt: now,
            updatedAt: now,
            syncStatus: 'created'
        };

        await db.recurringTemplates.add(template);
        return template;
    },

    async update(id: string, updates: Partial<RecurringTemplate>): Promise<void> {
        const template = await db.recurringTemplates.get(id);
        if (!template) return;

        const updated: RecurringTemplate = {
            ...template,
            ...updates,
            updatedAt: new Date(),
            syncStatus: template.syncStatus === 'created' ? 'created' : 'updated'
        };

        await db.recurringTemplates.put(updated);
    },

    async delete(id: string): Promise<void> {
        return db.transaction('rw', db.recurringTemplates, db.syncQueue, async () => {
            await db.syncQueue.add({
                id,
                table: 'recurringTemplates',
                action: 'delete',
                createdAt: new Date()
            });
            await db.recurringTemplates.delete(id);
        });
    }
};
