/**
 * Type definitions untuk Page
 */

export interface Page {
    id: string;
    title: string;
    description?: string; // Short description for card display
    parentId?: string | null;
    content?: string; // HTML content dari Tiptap editor
    createdAt: Date;
    updatedAt: Date;
    lastVisitedAt?: Date; // Tracking kapan terakhir dibuka (untuk Recently Visited)
}

export type CreatePageInput = Omit<Page, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePageInput = Partial<CreatePageInput>;
