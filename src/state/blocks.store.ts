/**
 * Blocks Store (Zustand)
 * State management untuk Blocks
 */

import { create } from 'zustand';
import type { Block, BlockType } from '../types/block';
import { blocksRepository } from '../data/blocks.repository';

interface BlocksState {
    blocks: Block[];
    isLoading: boolean;
    error: string | null;

    // Actions
    loadBlocks: (pageId: string) => Promise<void>;
    createBlock: (pageId: string, type: BlockType, content: string, order: number) => Promise<Block>;
    updateBlock: (id: string, content: string) => Promise<void>;
    deleteBlock: (id: string) => Promise<void>;
    clearBlocks: () => void;
}

export const useBlocksStore = create<BlocksState>((set) => ({
    blocks: [],
    isLoading: false,
    error: null,

    loadBlocks: async (pageId: string) => {
        set({ isLoading: true, error: null });
        try {
            const blocks = await blocksRepository.getByPageId(pageId);
            set({ blocks, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to load blocks', isLoading: false });
        }
    },

    createBlock: async (pageId: string, type: BlockType, content: string, order: number) => {
        set({ isLoading: true, error: null });
        try {
            const block = await blocksRepository.create({ pageId, type, content, order });
            set((state) => ({
                blocks: [...state.blocks, block].sort((a, b) => a.order - b.order),
                isLoading: false,
            }));
            return block;
        } catch (error) {
            set({ error: 'Failed to create block', isLoading: false });
            throw error;
        }
    },

    updateBlock: async (id: string, content: string) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await blocksRepository.update(id, { content });
            if (updated) {
                set((state) => ({
                    blocks: state.blocks.map((b) => (b.id === id ? updated : b)),
                    isLoading: false,
                }));
            }
        } catch (error) {
            set({ error: 'Failed to update block', isLoading: false });
        }
    },

    deleteBlock: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            await blocksRepository.delete(id);
            set((state) => ({
                blocks: state.blocks.filter((b) => b.id !== id),
                isLoading: false,
            }));
        } catch (error) {
            set({ error: 'Failed to delete block', isLoading: false });
        }
    },

    clearBlocks: () => {
        set({ blocks: [] });
    },
}));
