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
}));
