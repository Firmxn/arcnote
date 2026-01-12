import React, { useEffect, useState, useRef } from 'react';
import { usePagesStore } from '../../state/pages.store';
import { useSchedulesStore } from '../../state/schedules.store';
import { useFinanceStore } from '../../state/finance.store';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ActionGroup, ActionButton } from '../ui/ActionGroup';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import type { Page } from '../../types/page';
import type { ScheduleEvent } from '../../types/schedule';
import type { FinanceAccount } from '../../types/finance';
import dayjs from 'dayjs';

interface RecentItem {
    id: string;
    type: 'page' | 'schedule' | 'finance';
    title: string;
    date: Date;
    icon: React.ReactNode;
    data: Page | ScheduleEvent | FinanceAccount;
}

interface HomePageProps {
    onPageSelect?: (pageId: string) => void;
    onScheduleClick?: () => void;  // Navigate to schedule page
    onEventSelect?: (eventId: string) => void;  // Open specific event
    onFinanceClick?: (accountId: string) => void; // Open specific finance account
    onNewPageClick?: () => void; // Create new page
}

const WalletIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
);

export const HomePage: React.FC<HomePageProps> = ({
    onPageSelect,
    onScheduleClick,
    onEventSelect,
    onFinanceClick,
    onNewPageClick
}) => {
    const { pages, deletePage } = usePagesStore();
    const { events, markEventAsVisited, deleteEvent } = useSchedulesStore();
    const { accounts, loadAccounts, balances, loadBalances, markAccountAsVisited, deleteAccount } = useFinanceStore();

    const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
    const [itemToDelete, setItemToDelete] = useState<RecentItem | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    // Check Scroll Logic
    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [recentItems]);

    // Load Accounts
    useEffect(() => {
        loadAccounts();
    }, [loadAccounts]);

    useEffect(() => {
        if (accounts.length > 0) {
            loadBalances();
        }
    }, [accounts, loadBalances]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            const scrollAmount = 300;
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    useEffect(() => {
        // Combine pages, schedules, and accounts into recent items
        const items: RecentItem[] = [];

        // Add pages
        pages.forEach(page => {
            items.push({
                id: page.id,
                type: 'page',
                title: page.title,
                date: page.lastVisitedAt || page.updatedAt || page.createdAt,
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                ),
                data: page,
            });
        });

        // Add schedule events
        events.forEach((event: ScheduleEvent) => {
            items.push({
                id: event.id,
                type: 'schedule',
                title: event.title || 'Untitled Event',
                date: event.lastVisitedAt || event.updatedAt || event.createdAt,
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                ),
                data: event,
            });
        });

        // Add finance accounts
        accounts.forEach((acc: FinanceAccount) => {
            items.push({
                id: acc.id,
                type: 'finance',
                title: acc.title,
                date: acc.lastVisitedAt || acc.updatedAt || acc.createdAt,
                icon: <WalletIcon />,
                data: acc
            });
        });

        // Sort by date (most recent first)
        const sorted = items
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 12);

        setRecentItems(sorted);
    }, [pages, events, accounts]);

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            if (itemToDelete.type === 'page') {
                await deletePage(itemToDelete.id);
            } else if (itemToDelete.type === 'schedule') {
                await deleteEvent(itemToDelete.id);
            } else if (itemToDelete.type === 'finance') {
                await deleteAccount(itemToDelete.id);
            }
            setItemToDelete(null);
        } catch (error) {
            console.error('Failed to delete item:', error);
        }
    };

    // Reset scroll when items change
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = 0;
        }
    }, [recentItems]);

    const handleItemClick = (item: RecentItem) => {
        if (item.type === 'page' && onPageSelect) {
            onPageSelect(item.id);
        } else if (item.type === 'schedule' && onEventSelect) {
            markEventAsVisited(item.id);
            onEventSelect(item.id);
        } else if (item.type === 'finance' && onFinanceClick) {
            markAccountAsVisited(item.id);
            onFinanceClick(item.id);
        }
    };

    const getRelativeTime = (date: Date) => {
        const now = dayjs();
        const itemDate = dayjs(date);
        const diffMinutes = now.diff(itemDate, 'minute');
        // ... logic
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        const diffHours = now.diff(itemDate, 'hour');
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = now.diff(itemDate, 'day');
        if (diffDays < 7) return `${diffDays}d ago`;
        return itemDate.format('MMM D');
    };

    // Helper for formatting balance
    const formatBalance = (account: FinanceAccount) => {
        const amount = balances[account.id] || 0;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: account.currency || 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="h-full w-full bg-neutral dark:bg-primary flex flex-col overflow-y-auto">
            <div className="max-w-7xl w-full mx-auto px-4 md:px-8 py-6 md:py-12 flex-1 flex flex-col">
                {/* Header */}
                <div className="mb-6 md:mb-8 shrink-0">
                    <h1 className="text-2xl md:text-3xl font-bold text-text-neutral dark:text-text-primary mb-2">
                        Welcome back! 👋
                    </h1>
                    <p className="text-sm md:text-base text-text-neutral/60 dark:text-text-secondary">
                        Here's what you've been working on recently
                    </p>
                </div>

                {/* Recent Items Grid */}
                {recentItems.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center pb-20">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-xl font-semibold text-text-neutral dark:text-text-primary mb-2">
                            Nothing here yet
                        </h3>
                        <p className="text-text-neutral/60 dark:text-text-secondary">
                            Create a page or schedule an event to get started
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-2 mb-3 px-1">
                            <svg className="w-4 h-4 text-text-neutral/60 dark:text-text-secondary/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h2 className="text-sm font-semibold text-text-neutral/80 dark:text-text-secondary">
                                Recently visited
                            </h2>
                        </div>
                        <div className="relative group -mx-2 md:-mx-4 px-0.5">
                            {/* Navigation Buttons - Hidden on mobile */}
                            {canScrollLeft && (
                                <Button
                                    onClick={() => scroll('left')}
                                    variant="ghost"
                                    size="icon"
                                    circle
                                    className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-secondary border border-secondary/10 dark:border-primary/10 p-0"
                                    aria-label="Scroll left"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </Button>
                            )}

                            {canScrollRight && (
                                <Button
                                    onClick={() => scroll('right')}
                                    variant="ghost"
                                    size="icon"
                                    circle
                                    className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-secondary border border-secondary/10 dark:border-primary/10 p-0"
                                    aria-label="Scroll right"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Button>
                            )}

                            {/* Scroll Container */}
                            <div
                                ref={scrollContainerRef}
                                onScroll={checkScroll}
                                className="flex overflow-x-auto gap-3 md:gap-4 pb-4 mx-1 snap-x scroll-pl-2 md:scroll-pl-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                                style={{
                                    maskImage: `linear-gradient(to right, ${canScrollLeft ? 'transparent, black 48px' : 'black 0%'}, ${canScrollRight ? 'black calc(100% - 48px), transparent' : 'black 100%'})`,
                                    WebkitMaskImage: `linear-gradient(to right, ${canScrollLeft ? 'transparent, black 48px' : 'black 0%'}, ${canScrollRight ? 'black calc(100% - 48px), transparent' : 'black 100%'})`
                                }}
                            >
                                {recentItems.map((item) => (
                                    <div key={`${item.type}-${item.id}`} className="min-w-[240px] w-[240px] md:min-w-[260px] md:w-[260px] snap-start first:ml-2 md:first:ml-4 last:mr-2 md:last:mr-4 relative group">
                                        <Card
                                            icon={item.icon}
                                            title={item.title}
                                            // Description logic based on type
                                            description={
                                                item.type === 'page'
                                                    ? (item.data as Page).description || 'Page Document'
                                                    : item.type === 'finance'
                                                        ? (item.data as FinanceAccount).description || 'Finance Tracker'
                                                        : (item.data as ScheduleEvent).type || 'Calendar Event'
                                            }
                                            // Extra content for Finance (Balance)
                                            extra={
                                                item.type === 'finance' ? (
                                                    <div className="font-bold text-primary dark:text-accent font-mono">
                                                        {formatBalance(item.data as FinanceAccount)}
                                                    </div>
                                                ) : undefined
                                            }
                                            type={item.type === 'finance' ? 'page' : item.type} // Finance gets 'page' styling mostly
                                            onClick={() => handleItemClick(item)}
                                            updatedAt={getRelativeTime(item.date)}
                                            createdAt={getRelativeTime((item.data as any).createdAt)}
                                        />

                                        {/* Action Overlay */}
                                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <ActionGroup>
                                                <ActionButton
                                                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>}
                                                    onClick={(e) => { e.stopPropagation(); /* Archive Feature */ }}
                                                    title="Archive"
                                                />
                                                <ActionButton
                                                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                                                    variant="danger"
                                                    onClick={(e) => { e.stopPropagation(); setItemToDelete(item); }}
                                                    title="Delete"
                                                />
                                            </ActionGroup>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                <ConfirmDialog
                    isOpen={!!itemToDelete}
                    title={`Delete ${itemToDelete?.type === 'finance' ? 'Tracker' : itemToDelete?.type === 'schedule' ? 'Event' : 'Page'}`}
                    message={`Are you sure you want to delete "${itemToDelete?.title}"? This action cannot be undone.`}
                    confirmText="Delete"
                    danger
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setItemToDelete(null)}
                />

                {/* Quick Actions */}
                {recentItems.length > 0 && (
                    <div className="mt-8 md:mt-12 pt-6 md:pt-8">
                        <h2 className="text-xs md:text-sm font-bold text-text-neutral dark:text-text-secondary uppercase tracking-wider mb-3 md:mb-4 opacity-80">
                            Quick Actions
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                onClick={onScheduleClick}
                                variant="accent"
                                className="w-full sm:w-auto"
                                leftIcon={
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                }
                            >
                                New Event
                            </Button>
                            <Button
                                onClick={onNewPageClick}
                                variant="outline"
                                className="w-full sm:w-auto"
                                leftIcon={
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                }
                            >
                                New Page
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
