/**
 * Pages List Component
 * Menampilkan daftar pages
 */

import React from 'react';
import { usePagesStore } from '../../state/pages.store';

export const PagesList: React.FC = () => {
    const { pages, isLoading } = usePagesStore();

    if (isLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Pages
            </h2>
            {pages.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No pages yet</p>
            ) : (
                <ul className="space-y-2">
                    {pages.map((page) => (
                        <li
                            key={page.id}
                            className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        >
                            <h3 className="font-medium text-gray-900 dark:text-white">
                                {page.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Updated: {new Date(page.updatedAt).toLocaleDateString()}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
