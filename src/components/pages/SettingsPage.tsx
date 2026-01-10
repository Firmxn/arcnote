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
    };

    return (
        <div className="flex-1 h-screen overflow-y-auto bg-neutral transition-colors duration-200">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-neutral/95 backdrop-blur-sm border-b border-secondary/20 px-8 py-4">
                <h1 className="text-2xl font-bold text-text-neutral">Settings</h1>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-8 py-8">
                <div className="bg-white dark:bg-primary/5 rounded-lg border border-secondary/20 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-text-neutral mb-4">Storage Preferences</h2>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-text-neutral">Enable Backend Storage</p>
                            <p className="text-sm text-text-neutral opacity-70 mt-1">
                                {useBackend
                                    ? "Your notes are synced to the backend server."
                                    : "Your notes are stored locally in your browser (IndexedDB)."}
                            </p>
                        </div>

                        {/* Custom Toggle Switch */}
                        <button
                            onClick={handleToggle}
                            className={`
                                relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
                                ${useBackend ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}
                            `}
                            role="switch"
                            aria-checked={useBackend}
                        >
                            <span className="sr-only">Use backend storage</span>
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
                            Switching storage modes does not automatically migrate your existing notes.
                            Notes created in Local mode stay on this device.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
