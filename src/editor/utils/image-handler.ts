import { Editor } from '@tiptap/core';
import { storageService } from '../../services/storage.service';

/**
 * Handles image file processing (Upload vs Base64) based on settings and network status.
 * @param file The image file to process
 * @param editor The Tiptap editor instance
 * @param pos Optional position to insert the image at (defaults to current selection)
 */
export const handleImagePlacement = async (file: File, editor: Editor, pos?: number) => {
    if (!file.type.startsWith('image/')) return;

    try {
        const isCloudSyncEnabled = localStorage.getItem('arcnote_storage_preference') === 'backend';
        const isOnline = navigator.onLine;

        if (isCloudSyncEnabled && isOnline) {
            // --- Online Path: Upload to Supabase ---

            // Optional: Insert temporary placeholder or loading state here
            // For now we just wait (optimistic UI can be added later)
            const publicUrl = await storageService.uploadImage(file);

            if (pos !== undefined) {
                editor.chain().focus().setImage({ src: publicUrl }).run();
            } else {
                editor.chain().focus().setImage({ src: publicUrl }).run();
            }

        } else {
            // --- Offline Path: Force throw to catch block ---
            throw new Error('Offline or Local Mode');
        }

    } catch (error) {
        // --- Fallback: Base64 ---
        console.log('Falling back to Base64 image:', error);

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            if (result) {
                if (pos !== undefined) {
                    // If pos is provided (e.g. drop), we might need to set selection first or use insertContentAt
                    editor.chain().focus().insertContentAt(pos, {
                        type: 'image',
                        attrs: { src: result }
                    }).run();
                } else {
                    editor.chain().focus().setImage({ src: result }).run();
                }
            }
        };
        reader.readAsDataURL(file);
    }
};
