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
}

export type CreatePageInput = Omit<Page, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePageInput = Partial<CreatePageInput>;
