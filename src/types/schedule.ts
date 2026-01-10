/**
 * Type definitions untuk Schedule/Event
 */

export interface ScheduleEvent {
    id: string;
    title: string;
    description?: string;
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
}

export type CreateEventInput = Omit<ScheduleEvent, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateEventInput = Partial<CreateEventInput>;
