import React from 'react';
import { ListCard } from './ListCard';

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
                <ListCard
                    key={action.id}
                    icon={action.icon}
                    title={action.title}
                    subtitle={action.subtitle}
                    buttonText={action.buttonText}
                    onButtonClick={action.onButtonClick}
                />
            ))}
        </div>
    );
};
