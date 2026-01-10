/**
 * Tiptap Editor Extensions
 * Konfigurasi extensions untuk block-based editor
 */

import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
// Trigger HMR update
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Image from '@tiptap/extension-image';
import { SlashCommand } from './SlashCommand';
import suggestionUtils from './SuggestionList';

export const extensions = [
    StarterKit.configure({
        heading: {
            levels: [1, 2, 3],
        },
        bulletList: {
            keepMarks: true,
            keepAttributes: false,
        },
        orderedList: {
            keepMarks: true,
            keepAttributes: false,
        },
    }),
    Image.configure({
        inline: false,
        allowBase64: true,
    }),
    TextStyle,
    Color,
    Placeholder.configure({
        placeholder: ({ node }) => {
            if (node.type.name === 'heading') {
                return 'Heading';
            }
            return "Type '/' for commands...";
        },
    }),
    SlashCommand.configure({
        suggestion: suggestionUtils,
    }),
];
