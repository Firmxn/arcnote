import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { handleImagePlacement } from '../utils/image-handler';

export const ImageUpload = Extension.create({
    name: 'imageUpload',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('imageUpload'),
                props: {
                    // Handle Paste
                    handlePaste: (_view, event, _slice) => {
                        const items = Array.from(event.clipboardData?.items || []);
                        const imageItem = items.find((item) => item.type.startsWith('image/'));

                        if (imageItem) {
                            event.preventDefault(); // Stop default behavior
                            const file = imageItem.getAsFile();
                            if (file) {
                                // Use shared utility
                                handleImagePlacement(file, this.editor);
                                return true; // Handled
                            }
                        }
                        return false; // Not handled
                    },

                    // Handle Drop
                    handleDrop: (view, event, _slice, moved) => {
                        if (!moved && event.dataTransfer?.files?.length) {
                            const file = event.dataTransfer.files[0];
                            if (file.type.startsWith('image/')) {
                                event.preventDefault();

                                const coordinates = view.posAtCoords({
                                    left: event.clientX,
                                    top: event.clientY
                                });

                                // Use shared utility, passing the drop position
                                handleImagePlacement(file, this.editor, coordinates?.pos);
                                return true; // Handled
                            }
                        }
                        return false; // Not handled
                    },
                },
            }),
        ];
    },
});
