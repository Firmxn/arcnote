import { create } from 'zustand';
import type { ScheduleEvent, CreateEventInput, UpdateEventInput } from '../types/schedule';
import { schedulesRepository } from '../data/schedules.repository';

interface SchedulesState {
    events: ScheduleEvent[];
    isLoading: boolean;
    error: string | null;

    loadEvents: () => Promise<void>;
    createEvent: (input: CreateEventInput) => Promise<ScheduleEvent>;
    updateEvent: (id: string, input: UpdateEventInput) => Promise<void>;
    deleteEvent: (id: string) => Promise<void>;
    markEventAsVisited: (id: string) => Promise<void>;
    archiveEvent: (id: string) => Promise<void>;
    restoreEvent: (id: string) => Promise<void>;
    resetState: () => void;
    listenToSyncEvents: () => () => void;
}

export const useSchedulesStore = create<SchedulesState>((set, get) => ({
    events: [],
    isLoading: false,
    error: null,

    loadEvents: async () => {
        set({ isLoading: true, error: null });
        try {
            const events = await schedulesRepository.getAll();
            set({ events, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to load events', isLoading: false });
        }
    },

    createEvent: async (input: CreateEventInput) => {
        try {
            const newEvent = await schedulesRepository.create(input);
            set((state) => ({ events: [...state.events, newEvent].sort((a, b) => a.date.getTime() - b.date.getTime()) }));
            return newEvent;
        } catch (error) {
            set({ error: 'Failed to create event' });
            throw error;
        }
    },

    updateEvent: async (id: string, input: UpdateEventInput) => {
        try {
            await schedulesRepository.update(id, input);
            const updatedEvents = await schedulesRepository.getAll(); // Reload for simplicity
            set({ events: updatedEvents });
        } catch (error) {
            set({ error: 'Failed to update event' });
        }
    },

    deleteEvent: async (id: string) => {
        try {
            await schedulesRepository.delete(id);
            set((state) => ({ events: state.events.filter(e => e.id !== id) }));
        } catch (error) {
            set({ error: 'Failed to delete event' });
        }
    },

    markEventAsVisited: async (id: string) => {
        try {
            await schedulesRepository.markAsVisited(id);
            // Optionally reload or separate store for "recent"
        } catch (error) {
            console.error('Failed to mark as visited', error);
        }
    },

    archiveEvent: async (id: string) => {
        try {
            await schedulesRepository.update(id, { isArchived: true });
            get().loadEvents();
        } catch (error) {
            console.error('Failed to archive event', error);
        }
    },

    restoreEvent: async (id: string) => {
        try {
            await schedulesRepository.update(id, { isArchived: false });
            get().loadEvents();
        } catch (error) {
            console.error('Failed to restore event', error);
        }
    },


    resetState: () => {
        set({
            events: [],
            isLoading: false,
            error: null
        });
    },

    // --- Listener Implementation ---
    listenToSyncEvents: () => {
        const handleSyncCompleted = () => {
            console.log('🔄 Sync completed. Reloading schedules data...');
            get().loadEvents();
        };

        window.addEventListener('arcnote:sync-completed', handleSyncCompleted);

        return () => {
            window.removeEventListener('arcnote:sync-completed', handleSyncCompleted);
        };
    }
}));
