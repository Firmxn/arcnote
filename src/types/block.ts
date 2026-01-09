/**
 * Type definitions untuk Block
 */

export type BlockType =
    | 'paragraph'
    | 'heading-1'
    | 'heading-2'
    | 'heading-3'
    | 'bullet-list'
    | 'numbered-list'
    | 'todo'
    | 'quote'
    | 'divider';

export interface Block {
    id: string;
    pageId: string;
    type: BlockType;
    content: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

export type CreateBlockInput = Omit<Block, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateBlockInput = Partial<CreateBlockInput>;
