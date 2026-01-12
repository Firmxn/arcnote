import React, { useState, useEffect } from 'react';

export const SettingsPage: React.FC = () => {
    // State untuk storage mode (nanti bisa dipindah ke global store/context)
    const [useBackend, setUseBackend] = useState(false);

    // Load initial state dari localStorage saat mount
    useEffect(() => {
        const storedPreference = localStorage.getItem('arcnote_storage_preference');
        if (storedPreference === 'backend') {
            setUseBackend(true);
        }
    }, []);

    const handleToggle = () => {
        const newValue = !useBackend;
        setUseBackend(newValue);
        localStorage.setItem('arcnote_storage_preference', newValue ? 'backend' : 'local');
        // Force reload to apply storage change globally (reset stores)
        window.location.reload();
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-neutral dark:bg-primary flex flex-col">
            <div className="max-w-7xl w-full mx-auto px-4 md:px-8 py-6 md:py-12 flex-1 flex flex-col">
                {/* Header */}
                <div className="mb-6 md:mb-8 shrink-0">
                    <h1 className="text-2xl md:text-3xl font-bold text-text-neutral dark:text-text-primary mb-2">
                        Settings
                    </h1>
                    <p className="text-sm md:text-base text-text-neutral/60 dark:text-text-secondary">
                        Manage your application preferences
                    </p>
                </div>

                {/* Content */}
                <div className="max-w-3xl">
                    <div className="bg-white dark:bg-primary/5 rounded-lg border border-secondary/20  p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-text-neutral mb-4">Data Synchronization</h2>

                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="font-medium text-text-neutral">Enable Cloud Sync</p>
                                <p className="text-sm text-text-neutral opacity-70 mt-1">
                                    {useBackend
                                        ? "Your data is synced to the cloud and accessible across devices."
                                        : "Your data is stored only on this device (Browser Storage)."}
                                </p>
                            </div>

                            {/* Custom Toggle Switch */}
                            <button
                                onClick={handleToggle}
                                className={`
                                relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
                                ${useBackend ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}
                            `}
                                role="switch"
                                aria-checked={useBackend}
                            >
                                <span className="sr-only">Use cloud storage</span>
                                <span
                                    className={`
                                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                    ${useBackend ? 'translate-x-6' : 'translate-x-1'}
                                `}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
                        <div className="flex">
                            <svg className="h-5 w-5 text-accent mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-text-neutral opacity-80">
                                switching modes does not move your existing data.
                                Items created in one mode remain there until you switch back.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
