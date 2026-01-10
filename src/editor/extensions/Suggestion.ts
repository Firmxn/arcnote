import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import type { Instance } from 'tippy.js';
import { CommandList } from '../../components/editor/CommandList';

export default {
    items: ({ query }: { query: string }) => {
        return [
            {
                title: 'Text',
                icon: 'T',
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setParagraph().run();
                },
            },
            {
                title: 'Heading 1',
                icon: 'H1',
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
                },
            },
            {
                title: 'Heading 2',
                icon: 'H2',
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
                },
            },
            {
                title: 'Heading 3',
                icon: 'H3',
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
                },
            },
            {
                title: 'Bullet List',
                icon: '•',
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleBulletList().run();
                },
            },
            {
                title: 'Ordered List',
                icon: '1.',
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleOrderedList().run();
                },
            },
            {
                title: 'Code Block',
                icon: '<>',
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
                },
            },
            {
                title: 'Red Text',
                icon: 'R',
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setColor('#ef4444').run();
                },
            },
            {
                title: 'Blue Text',
                icon: 'B',
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setColor('#3b82f6').run();
                },
            },
            {
                title: 'Purple Text',
                icon: 'P',
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setColor('#8b5cf6').run();
                },
            },
            {
                title: 'Default Color',
                icon: 'D',
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).unsetColor().run();
                },
            },
        ]
            .filter((item) => item.title.toLowerCase().startsWith(query.toLowerCase()))
            .slice(0, 10);
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
