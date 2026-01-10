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
const localRepository: SchedulesRepo = {
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
};

/**
 * Backend Implementation (Supabase)
 */
const backendRepository: SchedulesRepo = {
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
            // Ensure array fields like attendees/customProperties are handled correctly by Supabase JSON
        }));
    },

    async create(input: CreateEventInput): Promise<ScheduleEvent> {
        const now = new Date();
        const newEvent = {
            id: nanoid(),
            ...input,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            // Date objects in input need to be ISO strings for Supabase if not auto-converted? 
            // Supabase client usually handles Date object -> ISO string in insert.
            // But let's be safe if input.date is Date.
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

        // Ensure Dates are strings if passed (though supabase-js handles Date objects usually)

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
};

const getRepo = (): SchedulesRepo => {
    const pref = localStorage.getItem('arcnote_storage_preference');
    return pref === 'backend' ? backendRepository : localRepository;
};

export const schedulesRepository: SchedulesRepo = {
    getAll: () => getRepo().getAll(),
    create: (input) => getRepo().create(input),
    update: (id, input) => getRepo().update(id, input),
    delete: (id) => getRepo().delete(id),
    markAsVisited: (id) => getRepo().markAsVisited(id),
};
