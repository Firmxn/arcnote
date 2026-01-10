/**
 * EmptyState Component - Linear.app Style
 * Minimalist empty state
 */

import React from 'react';

export const EmptyState: React.FC = () => {
    return (
        <div className="flex-1 h-screen flex items-center justify-center bg-neutral transition-colors duration-200">
            <div className="text-center max-w-md px-4">
                <h2 className="text-xl font-bold text-text-neutral mb-2">
                    No page selected
                </h2>
                <p className="text-sm text-text-neutral opacity-60">
                    Select a page from the sidebar or create a new one
                </p>
            </div>
        </div>
    );
};
