/**
 * ID generation utilities
 */

import { nanoid } from 'nanoid';

/**
 * Generate unique ID untuk pages dan blocks
 */
export const generateId = (): string => {
    return nanoid();
};

/**
 * Generate short ID (untuk display purposes)
 */
export const generateShortId = (): string => {
    return nanoid(8);
};
