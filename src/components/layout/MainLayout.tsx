/**
 * Main Layout Component
 * Layout utama aplikasi
 */

import React from 'react';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </div>
    );
};
