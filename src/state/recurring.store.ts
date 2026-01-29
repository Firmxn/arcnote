/**
 * Recurring Template Store
 * Manages UI state for Recurring Transactions
 */

import { create } from 'zustand';
import { recurringRepository } from '../data/recurring.repository';
import type { RecurringTemplate } from '../types/finance';

interface RecurringState {
    templates: RecurringTemplate[];
    isLoading: boolean;
    error: string | null;

    loadTemplates: () => Promise<void>;
    createTemplate: (input: Omit<RecurringTemplate, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => Promise<void>;
    updateTemplate: (id: string, updates: Partial<RecurringTemplate>) => Promise<void>;
    deleteTemplate: (id: string) => Promise<void>;
    toggleActive: (id: string, isActive: boolean) => Promise<void>;
}

export const useRecurringStore = create<RecurringState>((set, get) => ({
    templates: [],
    isLoading: false,
    error: null,

    loadTemplates: async () => {
        set({ isLoading: true, error: null });
        try {
            const templates = await recurringRepository.getAll();
            set({ templates, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to load recurring templates', isLoading: false });
        }
    },

    createTemplate: async (input) => {
        set({ isLoading: true, error: null });
        try {
            await recurringRepository.create(input);
            await get().loadTemplates();
        } catch (error) {
            set({ error: 'Failed to create template', isLoading: false });
            throw error;
        }
    },

    updateTemplate: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
            await recurringRepository.update(id, updates);
            await get().loadTemplates();
        } catch (error) {
            set({ error: 'Failed to update template', isLoading: false });
            throw error;
        }
    },

    deleteTemplate: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await recurringRepository.delete(id);
            await get().loadTemplates();
        } catch (error) {
            set({ error: 'Failed to delete template', isLoading: false });
            throw error;
        }
    },

    toggleActive: async (id, isActive) => {
        try {
            await recurringRepository.update(id, { isActive });
            await get().loadTemplates(); // Refresh UI
        } catch (error) {
            console.error('Failed to toggle template status', error);
        }
    }
}));
