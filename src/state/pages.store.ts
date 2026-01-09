/**
 * Pages Store (Zustand)
 * State management untuk Pages
 */

import { create } from 'zustand';
import type { Page } from '../types/page';
import { pagesRepository } from '../data/pages.repository';

interface PagesState {
    pages: Page[];
    currentPage: Page | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    loadPages: () => Promise<void>;
    createPage: (title: string) => Promise<Page>;
    updatePage: (id: string, title: string) => Promise<void>;
    deletePage: (id: string) => Promise<void>;
    setCurrentPage: (page: Page | null) => void;
}

export const usePagesStore = create<PagesState>((set) => ({
    pages: [],
    currentPage: null,
    isLoading: false,
    error: null,

    loadPages: async () => {
        set({ isLoading: true, error: null });
        try {
            const pages = await pagesRepository.getAll();
            set({ pages, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to load pages', isLoading: false });
        }
    },

    createPage: async (title: string) => {
        set({ isLoading: true, error: null });
        try {
            const page = await pagesRepository.create({ title });
            set((state) => ({
                pages: [page, ...state.pages],
                isLoading: false,
            }));
            return page;
        } catch (error) {
            set({ error: 'Failed to create page', isLoading: false });
            throw error;
        }
    },

    updatePage: async (id: string, title: string) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await pagesRepository.update(id, { title });
            if (updated) {
                set((state) => ({
                    pages: state.pages.map((p) => (p.id === id ? updated : p)),
                    currentPage: state.currentPage?.id === id ? updated : state.currentPage,
                    isLoading: false,
                }));
            }
        } catch (error) {
            set({ error: 'Failed to update page', isLoading: false });
        }
    },

    deletePage: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            await pagesRepository.delete(id);
            set((state) => ({
                pages: state.pages.filter((p) => p.id !== id),
                currentPage: state.currentPage?.id === id ? null : state.currentPage,
                isLoading: false,
            }));
        } catch (error) {
            set({ error: 'Failed to delete page', isLoading: false });
        }
    },

    setCurrentPage: (page: Page | null) => {
        set({ currentPage: page });
    },
}));
