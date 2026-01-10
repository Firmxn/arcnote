import { db } from './db';
import type { ScheduleEvent, CreateEventInput, UpdateEventInput } from '../types/schedule';
import { nanoid } from 'nanoid';

export const schedulesRepository = {
    async getAll(): Promise<ScheduleEvent[]> {
        return await db.schedules.orderBy('date').toArray();
    },

    async create(input: CreateEventInput): Promise<ScheduleEvent> {
        const event: ScheduleEvent = {
            id: nanoid(),
            ...input,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await db.schedules.add(event);
        return event;
    },

    async update(id: string, input: UpdateEventInput): Promise<void> {
        await db.schedules.update(id, {
            ...input,
            updatedAt: new Date(),
        });
    },

    async delete(id: string): Promise<void> {
        await db.schedules.delete(id);
    },
};
