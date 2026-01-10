import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import type { Instance } from 'tippy.js';
import { CommandList } from '../../components/editor/CommandList';
import React from 'react';

// Color Palette Dot Component
const ColorDot = ({ color }: { color: string }) => (
    <div
        className="w-3 h-3 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm"
        style={{ backgroundColor: color }}
    />
);

export default {
    items: ({ query }: { query: string }) => {
        // Basic formatting items
        const basics = [
            {
                title: 'Text',
                icon: <span className="text-gray-500 font-serif">T</span>,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setParagraph().run();
                },
            },
            {
                title: 'Heading 1',
                icon: <span className="text-gray-700 font-bold">H1</span>,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
                },
            },
            {
                title: 'Heading 2',
                icon: <span className="text-gray-700 font-bold">H2</span>,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
                },
            },
            {
                title: 'Heading 3',
                icon: <span className="text-gray-700 font-bold">H3</span>,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
                },
            },
            {
                title: 'Bullet List',
                icon: <div className="border border-gray-400 rounded-sm w-full h-full flex items-center justify-center p-0.5">•</div>,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleBulletList().run();
                },
            },
            {
                title: 'Ordered List',
                icon: <span className="text-xs font-mono">1.</span>,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleOrderedList().run();
                },
            },
            {
                title: 'Code Block',
                icon: <span className="font-mono text-xs">{'<>'}</span>,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
                },
            },
        ];

        // Color palette items
        const colors = [
            { name: 'Default', color: 'inherit', hex: null },
            { name: 'Gray', color: '#6b7280', hex: '#6b7280' },
            { name: 'Red', color: '#ef4444', hex: '#ef4444' },
            { name: 'Orange', color: '#f97316', hex: '#f97316' },
            { name: 'Yellow', color: '#eab308', hex: '#eab308' },
            { name: 'Green', color: '#22c55e', hex: '#22c55e' },
            { name: 'Blue', color: '#3b82f6', hex: '#3b82f6' },
            { name: 'Purple', color: '#a855f7', hex: '#a855f7' },
            { name: 'Pink', color: '#ec4899', hex: '#ec4899' },
        ];

        const colorItems = colors.map(c => ({
            title: c.name + ' Color',
            icon: c.hex ? <ColorDot color={c.hex} /> : <span className="text-xs text-gray-500">Auto</span>,
            command: ({ editor, range }: any) => {
                if (c.hex) {
                    editor.chain().focus().deleteRange(range).setColor(c.hex).run();
                } else {
                    editor.chain().focus().deleteRange(range).unsetColor().run();
                }
            }
        }));

        // Color Category Item (untuk nested menu)
        const colorCategoryItem = {
            title: 'Color',
            icon: <span className="text-gray-500">🎨</span>,
            submenu: colorItems
        };

        // Logic: Jika query kosong, tampilkan basics + color category
        // Jika ada query, cari di semua items (flattened)
        if (!query) {
            return [...basics, colorCategoryItem];
        }

        const allItems = [...basics, ...colorItems];
        return allItems
            .filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 15);
    },

    render: () => {
        let component: ReactRenderer;
        let popup: Instance[];

        return {
            onStart: (props: any) => {
                component = new ReactRenderer(CommandList, {
                    props,
                    editor: props.editor,
                });

                if (!props.clientRect) {
                    return;
                }

                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                });
            },

            onUpdate(props: any) {
                component.updateProps(props);

                if (!props.clientRect) {
                    return;
                }

                popup[0].setProps({
                    getReferenceClientRect: props.clientRect,
                });
            },

            onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                    popup[0].hide();
                    return true;
                }

                return (component.ref as any)?.onKeyDown(props);
            },

            onExit() {
                popup[0].destroy();
                component.destroy();
            },
        };
    },
};
