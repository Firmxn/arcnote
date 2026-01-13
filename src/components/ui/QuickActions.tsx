import React from 'react';

interface QuickActionItem {
    id: string;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    buttonText: string;
    onButtonClick: () => void;
}

interface QuickActionsProps {
    onAddFinance?: () => void;
    onAddPage?: () => void;
    onAddSchedule?: () => void;
    onViewArchive?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
    onAddFinance,
    onAddPage,
    onAddSchedule,
    onViewArchive
}) => {
    const quickActions: QuickActionItem[] = [
        {
            id: 'finance',
            title: 'Finance',
            subtitle: 'Track your expenses',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ),
            buttonText: 'Add',
            onButtonClick: onAddFinance || (() => { })
        },
        {
            id: 'page',
            title: 'Page',
            subtitle: 'Create new document',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            buttonText: 'Add',
            onButtonClick: onAddPage || (() => { })
        },
        {
            id: 'schedule',
            title: 'Schedule',
            subtitle: 'Plan your events',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            buttonText: 'Add',
            onButtonClick: onAddSchedule || (() => { })
        },
        {
            id: 'archive',
            title: 'Archive',
            subtitle: 'View archived items',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
            ),
            buttonText: 'View',
            onButtonClick: onViewArchive || (() => { })
        }
    ];

    return (
        <div className="space-y-2">
            {quickActions.map((action) => (
                <div
                    key={action.id}
                    className="flex items-center justify-between p-4 bg-white dark:bg-secondary rounded-xl border border-secondary/10 dark:border-white/5 hover:border-secondary/20 dark:hover:border-white/10 transition-all duration-200 group"
                >
                    {/* Left: Icon + Text */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Icon */}
                        <div className="w-10 h-10 rounded-lg bg-accent/10 dark:bg-accent/20 flex items-center justify-center text-accent shrink-0">
                            {action.icon}
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-text-neutral dark:text-text-primary truncate">
                                {action.title}
                            </h3>
                            <p className="text-xs text-text-neutral/60 dark:text-text-secondary/60 truncate">
                                {action.subtitle}
                            </p>
                        </div>
                    </div>

                    {/* Right: Button */}
                    <button
                        onClick={action.onButtonClick}
                        className="px-4 py-1.5 text-xs font-medium text-accent hover:text-accent-hover border border-accent/20 hover:border-accent/40 rounded-full transition-all duration-200 hover:bg-accent/5 shrink-0"
                    >
                        {action.buttonText}
                    </button>
                </div>
            ))}
        </div>
    );
};
