/**
 * Schedules Repository
 * Data access layer untuk Schedules / Events
 * Supports switching between Local (IndexedDB) and Backend (Supabase)
 */
import { db } from './db';
import type { ScheduleEvent, CreateEventInput, UpdateEventInput } from '../types/schedule';
import { nanoid } from 'nanoid';
import { supabase } from './supabase';

interface SchedulesRepo {
    getAll(): Promise<ScheduleEvent[]>;
    create(input: CreateEventInput): Promise<ScheduleEvent>;
    update(id: string, input: UpdateEventInput): Promise<void>;
    delete(id: string): Promise<void>;
    markAsVisited(id: string): Promise<void>;
}

/**
 * Local Implementation
 */
/**
 * Local Implementation
 */
export const localSchedulesRepository = {
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

    async markAsVisited(id: string): Promise<void> {
        await db.schedules.update(id, {
            lastVisitedAt: new Date(),
        });
    },

    async sync(event: ScheduleEvent): Promise<void> {
        await db.schedules.put(event);
    }
};

/**
 * Backend Implementation (Supabase)
 */
/**
 * Backend Implementation (Supabase)
 */
export const backendSchedulesRepository = {
    async getAll(): Promise<ScheduleEvent[]> {
        const { data, error } = await supabase
            .from('schedules')
            .select('*')
            .order('date', { ascending: true });

        if (error) {
            console.error('Supabase Error:', error);
            return [];
        }

        return data.map(e => ({
            ...e,
            date: new Date(e.date),
            endDate: e.endDate ? new Date(e.endDate) : undefined,
            createdAt: new Date(e.createdAt),
            updatedAt: new Date(e.updatedAt),
            lastVisitedAt: e.lastVisitedAt ? new Date(e.lastVisitedAt) : undefined,
        }));
    },

    async create(input: CreateEventInput): Promise<ScheduleEvent> {
        const now = new Date();
        const newEvent = {
            id: nanoid(),
            ...input,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
        };

        const { data, error } = await supabase
            .from('schedules')
            .insert(newEvent)
            .select()
            .single();

        if (error) throw error;

        return {
            ...data,
            date: new Date(data.date),
            endDate: data.endDate ? new Date(data.endDate) : undefined,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
        };
    },

    async update(id: string, input: UpdateEventInput): Promise<void> {
        const updateData: any = {
            ...input,
            updatedAt: new Date().toISOString()
        };

        const { error } = await supabase
            .from('schedules')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('schedules')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async markAsVisited(id: string): Promise<void> {
        await supabase
            .from('schedules')
            .update({ lastVisitedAt: new Date().toISOString() })
            .eq('id', id);
    },

    // Custom method for Syncing Local -> Cloud
    async sync(event: ScheduleEvent): Promise<void> {
        const payload = {
            ...event,
            date: event.date.toISOString(),
            endDate: event.endDate ? event.endDate.toISOString() : null,
            createdAt: event.createdAt.toISOString(),
            updatedAt: event.updatedAt.toISOString(),
            lastVisitedAt: event.lastVisitedAt ? event.lastVisitedAt.toISOString() : null
        };
        const { error } = await supabase.from('schedules').upsert(payload);
        if (error) throw error;
    }
};

const getRepo = (): SchedulesRepo => {
    const pref = localStorage.getItem('arcnote_storage_preference');
    return pref === 'backend' ? backendSchedulesRepository : localSchedulesRepository;
};

export const schedulesRepository: SchedulesRepo = {
    getAll: () => getRepo().getAll(),
    create: (input) => getRepo().create(input),
    update: (id, input) => getRepo().update(id, input),
    delete: (id) => getRepo().delete(id),
    markAsVisited: (id) => getRepo().markAsVisited(id),
};
