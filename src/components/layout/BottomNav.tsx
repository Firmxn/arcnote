import React from 'react';

interface BottomNavProps {
    onHomeClick?: () => void;
    onFinanceClick?: () => void;
    onScheduleClick?: () => void;
    onSettingsClick?: () => void;
    onPagesClick?: () => void;
    onCreatePageClick?: () => void;
    currentView?: 'home' | 'page' | 'pages' | 'settings' | 'schedule' | 'finance';
}

export const BottomNav: React.FC<BottomNavProps> = ({
    onHomeClick,
    onFinanceClick,
    onScheduleClick,
    onSettingsClick,
    onPagesClick,
    onCreatePageClick,
    currentView
}) => {
    const isOnPagesView = currentView === 'pages';

    // FAB click handler - context aware
    const handleFABClick = () => {
        if (isOnPagesView) {
            // Already on pages list, create new page
            onCreatePageClick?.();
        } else {
            // Navigate to pages list
            onPagesClick?.();
        }
    };

    const navItems = [
        {
            id: 'home',
            label: 'Home',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
            onClick: onHomeClick,
            isActive: currentView === 'home'
        },
        {
            id: 'finance',
            label: 'Finance',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            onClick: onFinanceClick,
            isActive: currentView === 'finance'
        },
        {
            id: 'schedule',
            label: 'Schedule',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            onClick: onScheduleClick,
            isActive: currentView === 'schedule'
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            onClick: onSettingsClick,
            isActive: currentView === 'settings'
        }
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
            <div className="mx-4 mb-4">
                <div className="bg-white dark:bg-secondary rounded-2xl shadow-lg border border-secondary/20 dark:border-neutral">
                    <div className="flex items-center justify-around px-2 py-2 relative">
                        {/* Left items (Home, Finance) */}
                        {navItems.slice(0, 2).map((item) => (
                            <button
                                key={item.id}
                                onClick={item.onClick}
                                className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all ${item.isActive
                                    ? 'text-accent dark:text-accent'
                                    : 'text-text-neutral/60 dark:text-text-secondary/60 hover:text-text-neutral dark:hover:text-text-secondary'
                                    }`}
                            >
                                {item.icon}
                                <span className="text-xs font-medium">{item.label}</span>
                            </button>
                        ))}

                        {/* FAB - Center */}
                        <button
                            onClick={handleFABClick}
                            className="flex items-center justify-center w-14 h-14 -mt-8 rounded-full bg-accent hover:bg-accent-hover shadow-lg transition-all active:scale-95"
                            title={isOnPagesView ? 'Create Page' : 'View Pages'}
                        >
                            <svg
                                className="w-6 h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                {isOnPagesView ? (
                                    /* Plus icon when on pages view */
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                ) : (
                                    /* Pages/Grid icon when not on pages view */
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                )}
                            </svg>
                        </button>

                        {/* Right items (Schedule, Settings) */}
                        {navItems.slice(2, 4).map((item) => (
                            <button
                                key={item.id}
                                onClick={item.onClick}
                                className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all ${item.isActive
                                    ? 'text-accent dark:text-accent'
                                    : 'text-text-neutral/60 dark:text-text-secondary/60 hover:text-text-neutral dark:hover:text-text-secondary'
                                    }`}
                            >
                                {item.icon}
                                <span className="text-xs font-medium">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    );
};
