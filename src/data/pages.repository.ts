/**
 * Pages Repository
 * Data access layer untuk Pages
 * Supports switching between Local (IndexedDB) and Backend (Supabase)
 */

import { db } from './db';
import type { Page, CreatePageInput, UpdatePageInput } from '../types/page';
import { nanoid } from 'nanoid';
import { supabase } from './supabase';

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

/**
 * Local Implementation (IndexedDB via Dexie)
 */
const localRepository: PagesRepo = {
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
        };

        await db.pages.update(id, updated);
        return updated;
    },

    async delete(id: string): Promise<void> {
        await db.pages.delete(id);
    },

    async markAsVisited(id: string): Promise<void> {
        await db.pages.update(id, {
            lastVisitedAt: new Date(),
        });
    },
};

/**
 * Backend Implementation (Supabase)
 */
const backendRepository: PagesRepo = {
    async getAll(): Promise<Page[]> {
        const { data, error } = await supabase
            .from('pages')
            .select('*')
            .order('updatedAt', { ascending: false });

        if (error) {
            console.error('Supabase Error:', error);
            return [];
        }

        return data.map(p => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
            lastVisitedAt: p.lastVisitedAt ? new Date(p.lastVisitedAt) : undefined
        }));
    },

    async getById(id: string): Promise<Page | undefined> {
        const { data, error } = await supabase
            .from('pages')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return undefined;

        return {
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            lastVisitedAt: data.lastVisitedAt ? new Date(data.lastVisitedAt) : undefined
        };
    },

    async create(input: CreatePageInput): Promise<Page> {
        const now = new Date();
        const newPage = {
            id: nanoid(),
            ...input,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
        };

        const { data, error } = await supabase
            .from('pages')
            .insert(newPage)
            .select()
            .single();

        if (error) throw error;

        return {
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
        };
    },

    async update(id: string, input: UpdatePageInput): Promise<Page | undefined> {
        const updateData = {
            ...input,
            updatedAt: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('pages')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            lastVisitedAt: data.lastVisitedAt ? new Date(data.lastVisitedAt) : undefined
        };
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('pages')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async markAsVisited(id: string): Promise<void> {
        await supabase
            .from('pages')
            .update({ lastVisitedAt: new Date().toISOString() })
            .eq('id', id);
    },
};

/**
 * Factory to choose implementation
 */
const getRepo = (): PagesRepo => {
    const pref = localStorage.getItem('arcnote_storage_preference');
    return pref === 'backend' ? backendRepository : localRepository;
};

/**
 * Exported Facade
 */
export const pagesRepository: PagesRepo = {
    getAll: () => getRepo().getAll(),
    getById: (id) => getRepo().getById(id),
    create: (input) => getRepo().create(input),
    update: (id, input) => getRepo().update(id, input),
    delete: (id) => getRepo().delete(id),
    markAsVisited: (id) => getRepo().markAsVisited(id),
};
