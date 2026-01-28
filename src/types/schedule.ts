/**
 * Type definitions untuk Schedule/Event
 */

import type { Syncable } from './sync';

export interface ScheduleEvent extends Syncable {
    id: string;
    title: string;
    content?: string; // HTML content dari editor
    date: Date;
    endDate?: Date; // Support range/duration
    isAllDay: boolean;
    type?: string; // e.g., 'Meeting', 'Task', 'Personal'
    attendees?: string[]; // List of names for now
    customProperties?: Record<string, any>; // Dynamic properties
    createdAt: Date;
    updatedAt: Date;
    lastVisitedAt?: Date; // Tracking kapan terakhir dibuka (untuk Recently Visited)
    isArchived?: boolean;
}

export type CreateEventInput = Omit<ScheduleEvent, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateEventInput = Partial<CreateEventInput>;
