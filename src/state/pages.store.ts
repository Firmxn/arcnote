/**
 * Pages Store (Zustand)
 * State management untuk Pages
 */

import { create } from 'zustand';
import type { Page, UpdatePageInput } from '../types/page';
import { pagesRepository, backendPagesRepository, localPagesRepository } from '../data/pages.repository';

interface PagesState {
    pages: Page[];
    currentPage: Page | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    loadPages: () => Promise<void>;
    createPage: (title: string, parentId?: string) => Promise<Page>;
    updatePage: (id: string, input: UpdatePageInput) => Promise<void>;
    deletePage: (id: string) => Promise<void>;
    setCurrentPage: (page: Page | null) => void;
    markPageAsVisited: (id: string) => Promise<void>;
    archivePage: (id: string) => Promise<void>;
    restorePage: (id: string) => Promise<void>;
    syncToCloud: (id: string) => Promise<void>;
    syncToLocal: (id: string) => Promise<void>;
}

export const usePagesStore = create<PagesState>((set, get) => ({
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

    createPage: async (title: string, parentId?: string) => {
        try {
            const newPage = await pagesRepository.create({
                title,
                parentId: parentId || null
            });
            // Update local state -> prepend new page
            set((state) => ({ pages: [newPage, ...state.pages] }));
            return newPage;
        } catch (error) {
            set({ error: 'Failed to create page' });
            throw error;
        }
    },

    updatePage: async (id: string, input: UpdatePageInput) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await pagesRepository.update(id, input);
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
            console.log('Deleting page:', id);
            await pagesRepository.delete(id);
            set((state) => ({
                pages: state.pages.filter((p) => p.id !== id),
                currentPage: state.currentPage?.id === id ? null : state.currentPage,
                isLoading: false,
            }));
            console.log('Page deleted successfully');
        } catch (error) {
            console.error('Failed to delete page:', error);
            set({ error: 'Failed to delete page', isLoading: false });
        }
    },

    setCurrentPage: (page: Page | null) => {
        set({ currentPage: page });
        // Auto-mark as visited saat page dibuka
        if (page) {
            pagesRepository.markAsVisited(page.id).catch(console.error);
        }
    },

    markPageAsVisited: async (id: string) => {
        try {
            await pagesRepository.markAsVisited(id);
            // Reload pages untuk update lastVisitedAt di state
            const pages = await pagesRepository.getAll();
            set({ pages });
        } catch (error) {
            console.error('Failed to mark page as visited:', error);
        }
    },

    archivePage: async (id: string) => {
        try {
            await pagesRepository.update(id, { isArchived: true });
            get().loadPages();
        } catch (error) {
            console.error('Failed to archive page:', error);
        }
    },

    restorePage: async (id: string) => {
        try {
            await pagesRepository.update(id, { isArchived: false });
            get().loadPages();
        } catch (error) {
            console.error('Failed to restore page:', error);
        }
    },

    syncToCloud: async (id: string) => {
        const page = get().pages.find(p => p.id === id);
        if (!page) throw new Error("Page not found locally");
        await backendPagesRepository.sync(page);
    },

    syncToLocal: async (id: string) => {
        const page = get().pages.find(p => p.id === id);
        if (!page) throw new Error("Page not found");
        await localPagesRepository.sync(page);
    },
}));
