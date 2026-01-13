import React from 'react';
import { Card } from './Card';
import { ActionGroup, ActionButton } from './ActionGroup';
import { useLongPress } from '../../hooks/useLongPress';
import type { Page } from '../../types/page';
import type { ScheduleEvent } from '../../types/schedule';
import type { FinanceAccount } from '../../types/finance';

interface RecentItemCardProps {
    item: {
        id: string;
        type: 'page' | 'schedule' | 'finance';
        title: string;
        date: Date;
        icon: React.ReactNode;
        data: Page | ScheduleEvent | FinanceAccount;
    };
    onItemClick: () => void;
    onLongPress: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    onArchive: () => void;
    onDelete: () => void;
    formatBalance?: (data: FinanceAccount) => string;
    getRelativeTime: (date: Date) => string;
}

/**
 * RecentItemCard Component
 * Individual card for recently visited items with long press support
 */
export const RecentItemCard: React.FC<RecentItemCardProps> = ({
    item,
    onItemClick,
    onLongPress,
    onContextMenu,
    onArchive,
    onDelete,
    formatBalance,
    getRelativeTime
}) => {
    const longPressHandlers = useLongPress({
        onLongPress,
        onClick: onItemClick,
        delay: 500
    });

    return (
        <div
            className="min-w-[240px] w-[240px] md:min-w-[260px] md:w-[260px] snap-start first:ml-2 md:first:ml-4 last:mr-2 md:last:mr-4 relative group"
            {...longPressHandlers}
            onContextMenu={onContextMenu}
        >
            <Card
                icon={item.icon}
                title={item.title}
                description={
                    item.type === 'page'
                        ? (item.data as Page).description || 'Page Document'
                        : item.type === 'finance'
                            ? (item.data as FinanceAccount).description || 'Finance Tracker'
                            : (item.data as ScheduleEvent).type || 'Calendar Event'
                }
                extra={
                    item.type === 'finance' && formatBalance ? (
                        <div className="font-bold text-primary dark:text-accent font-mono">
                            {formatBalance(item.data as FinanceAccount)}
                        </div>
                    ) : undefined
                }
                type={item.type === 'finance' ? 'page' : item.type}
                onClick={() => { }} // Handled by longPressHandlers
                updatedAt={getRelativeTime(item.date)}
                createdAt={getRelativeTime((item.data as any).createdAt)}
            />

            {/* Action Overlay - Hidden on mobile, visible on desktop hover */}
            <div className="absolute top-3 right-3 hidden md:block md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                <ActionGroup>
                    <ActionButton
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>}
                        variant="primary"
                        onClick={(e) => { e.stopPropagation(); onArchive(); }}
                        title="Archive"
                    />
                    <ActionButton
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                        variant="danger"
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        title="Delete"
                    />
                </ActionGroup>
            </div>
        </div>
    );
};
