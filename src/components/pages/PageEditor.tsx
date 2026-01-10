/**
 * PageEditor Component - Linear.app Style
 * Editor dengan Tiptap integration
 */

import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import type { Page } from '../../types/page';
import { usePagesStore } from '../../state/pages.store';
import { extensions } from '../../editor/extensions';
import { debounce } from '../../utils/debounce';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Button } from '../ui/Button';

interface PageEditorProps {
    page: Page;
}

export const PageEditor: React.FC<PageEditorProps> = ({ page }) => {
    const { updatePage, deletePage } = usePagesStore();
    const [title, setTitle] = useState(page.title);
    const [description, setDescription] = useState(page.description || '');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // State untuk Dialog Delete
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Debounced save function
    const debouncedSave = React.useMemo(
        () =>
            debounce((id: string, content: string) => {
                updatePage(id, { content });
            }, 1000), // Auto-save after 1 second of inactivity
        [updatePage]
    );

    // Initialize Tiptap editor
    const editor = useEditor({
        extensions,
        content: page.content || '',
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert max-w-none focus:outline-none',
            },
        },
        onUpdate: ({ editor }) => {
            const content = editor.getHTML();
            debouncedSave(page.id, content);
        },
    });

    useEffect(() => {
        setTitle(page.title);
        setDescription(page.description || '');
        if (editor && page.content) {
            // Cek apakah konten berbeda drastis agar tidak menimpa state editor saat typing
            // Tapi karena editor hanya diremount saat page.id berubah (key di App.tsx), ini aman.
            if (editor.getHTML() !== page.content) {
                editor.commands.setContent(page.content);
            }
        }
    }, [page.id, page.title, page.description, page.content, editor]);

    const handleTitleBlur = () => {
        setIsEditingTitle(false);
        if (title.trim() && title !== page.title) {
            updatePage(page.id, { title: title.trim() });
        } else if (!title.trim()) {
            setTitle(page.title);
        }
    };

    const handleDescriptionBlur = () => {
        setIsEditingDescription(false);
        if (description.trim() !== (page.description || '')) {
            updatePage(page.id, { description: description.trim() || undefined });
        }
    };

    // Handler saat tombol delete di menu diklik
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(false); // Tutup menu dropdown
        setIsDeleteDialogOpen(true); // Buka dialog konfirmasi
    };

    // Handler konfirmasi delete
    const handleConfirmDelete = async () => {
        await deletePage(page.id);
        setIsDeleteDialogOpen(false);
    };

    return (
        <div className="flex-1 h-screen overflow-y-auto bg-neutral transition-colors duration-200">
            {/* Custom Confirm Dialog */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                title="Delete Page"
                message={`Are you sure you want to delete "${page.title}"? This action cannot be undone.`}
                confirmText="Delete"
                danger
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsDeleteDialogOpen(false)}
            />

            {/* Top Bar */}
            <div className="sticky top-0 z-10 bg-neutral/95 backdrop-blur-sm border-b border-secondary/20 transition-colors duration-200">
                <div className="max-w-6xl mx-auto px-8 py-3 flex items-center justify-between">
                    <div className="text-xs font-medium text-text-neutral opacity-70">
                        {new Date(page.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    </div>

                    <div className="relative">
                        <Button
                            onClick={() => setShowMenu(!showMenu)}
                            variant="ghost"
                            size="icon"
                            className="h-auto w-auto p-1 text-text-neutral/70 hover:text-text-neutral"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                        </Button>

                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowMenu(false)}
                                />
                                <div className="absolute right-0 mt-1 w-40 bg-white border border-secondary/20 rounded shadow-lg py-1 z-20">
                                    <Button
                                        onClick={handleDeleteClick}
                                        variant="ghost"
                                        className="w-full justify-start px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-none h-auto"
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-8 py-12">
                {/* Page Title */}
                <div className="mb-2">
                    {isEditingTitle ? (
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleTitleBlur();
                                }
                            }}
                            autoFocus
                            className="w-full text-3xl font-bold text-text-neutral bg-transparent border-none outline-none focus:outline-none placeholder-text-neutral/30"
                            placeholder="Untitled"
                        />
                    ) : (
                        <h1
                            onClick={() => setIsEditingTitle(true)}
                            className="text-3xl font-bold text-text-neutral cursor-text hover:text-text-neutral/80 transition-colors"
                        >
                            {title || 'Untitled'}
                        </h1>
                    )}
                </div>

                {/* Page Description */}
                <div className="mb-8">
                    {isEditingDescription ? (
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onBlur={handleDescriptionBlur}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    handleDescriptionBlur();
                                }
                            }}
                            autoFocus
                            rows={2}
                            className="w-full text-base text-text-neutral/70 bg-transparent border-none outline-none focus:outline-none placeholder-text-neutral/30 resize-none"
                            placeholder="Add a description..."
                        />
                    ) : (
                        <p
                            onClick={() => setIsEditingDescription(true)}
                            className="text-base text-text-neutral/70 cursor-text hover:text-text-neutral/60 transition-colors min-h-[24px]"
                        >
                            {description || 'Add a description...'}
                        </p>
                    )}
                </div>

                {/* Tiptap Editor */}
                <EditorContent
                    editor={editor}
                    className="min-h-[400px] text-base leading-relaxed text-text-neutral"
                />
            </div>
        </div>
    );
};
