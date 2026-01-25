import React from 'react';
import { useTheme } from '../../hooks/useTheme';

import { PageHeader } from '../ui/PageHeader';
import { useAuthStore } from '../../state/auth.store';
import { useNavigate } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const { user, signOut } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        if (confirm('Are you sure you want to logout?')) {
            await signOut();
            navigate('/');
        }
    };

    return (
        <div className="h-full w-full bg-neutral dark:bg-primary flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <div className="max-w-7xl w-full mx-auto px-4 md:px-8 py-6 md:py-12 pb-[70px] flex-1 flex flex-col">
                {/* Header */}
                <PageHeader
                    title="Settings"
                    description="Manage your application preferences"
                    className="md:mb-8 shrink-0"
                />

                {/* Content */}
                <div className="space-y-4">
                    {/* Theme Section */}
                    <div className="bg-white dark:bg-primary/5 rounded-lg border border-secondary/20 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-text-neutral dark:text-text-primary mb-4">Appearance</h2>

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-accent/10">
                                    {theme === 'light' ? (
                                        <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                        </svg>
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-text-neutral dark:text-text-primary">Theme</p>
                                    <p className="text-sm text-text-neutral/70 dark:text-text-secondary mt-0.5">
                                        {theme === 'light' ? 'Light mode' : 'Dark mode'}
                                    </p>
                                </div>
                            </div>

                            {/* Theme Toggle Switch */}
                            <button
                                onClick={toggleTheme}
                                className={`
                                relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
                                ${theme === 'dark' ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}
                            `}
                                role="switch"
                                aria-checked={theme === 'dark'}
                                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                            >
                                <span className="sr-only">Toggle theme</span>
                                <span
                                    className={`
                                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                    ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}
                                `}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Cloud Sync Section */}
                    <div className="bg-white dark:bg-primary/5 rounded-lg border border-secondary/20 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-text-neutral dark:text-text-primary mb-4">Cloud Sync</h2>

                        {user ? (
                            <>
                                {/* Logged In State */}
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-text-neutral dark:text-text-primary">Auto Sync Enabled</p>
                                        <p className="text-sm text-text-neutral/70 dark:text-text-secondary mt-0.5">
                                            Logged in as <span className="font-medium">{user.email}</span>
                                        </p>
                                        <p className="text-sm text-text-neutral/60 dark:text-text-secondary mt-2">
                                            Your data is automatically synced to the cloud when online. All data is stored locally first for offline access.
                                        </p>
                                    </div>
                                </div>

                                {/* Logout Button */}
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Guest State */}
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-accent/10">
                                        <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-text-neutral dark:text-text-primary">Guest Mode</p>
                                        <p className="text-sm text-text-neutral/60 dark:text-text-secondary mt-1">
                                            You're using the app as a guest. All your data is stored locally on this device only.
                                        </p>
                                    </div>
                                </div>

                                {/* Login Button */}
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    Login to Enable Cloud Sync
                                </button>
                            </>
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                        <div className="flex">
                            <svg className="h-5 w-5 text-accent mt-0.5 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm text-text-neutral/80 dark:text-text-secondary space-y-1">
                                <p className="font-medium">Local-First Architecture</p>
                                <p>All data is stored on your device first. Cloud sync is optional and happens automatically in the background when you're logged in and online.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
