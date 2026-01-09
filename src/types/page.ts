/**
 * Type definitions untuk Page
 */

export interface Page {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
}

export type CreatePageInput = Omit<Page, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePageInput = Partial<CreatePageInput>;
