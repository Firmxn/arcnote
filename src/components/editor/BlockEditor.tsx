/**
 * Block Editor Component
 * Placeholder untuk Tiptap editor
 */

import React from 'react';

interface BlockEditorProps {
    pageId: string;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({ pageId }) => {
    return (
        <div className="p-4">
            <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-500 dark:text-gray-400">
                    Editor untuk page: {pageId}
                </p>
                {/* Tiptap editor akan diimplementasikan di sini */}
            </div>
        </div>
    );
};
