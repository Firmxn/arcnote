import React, { useEffect, useState, useRef } from 'react';
import { usePagesStore } from '../../state/pages.store';
import { useSchedulesStore } from '../../state/schedules.store';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { Page } from '../../types/page';
import type { ScheduleEvent } from '../../types/schedule';
import dayjs from 'dayjs';

interface RecentItem {
    id: string;
    type: 'page' | 'schedule';
    title: string;
    date: Date;
    icon: React.ReactNode;
    data: Page | ScheduleEvent;
}

interface HomePageProps {
    onPageSelect?: (pageId: string) => void;
    onScheduleClick?: () => void;  // Navigate to schedule page
    onEventSelect?: (eventId: string) => void;  // Open specific event
    onNewPageClick?: () => void; // Create new page
}

export const HomePage: React.FC<HomePageProps> = ({ onPageSelect, onScheduleClick, onEventSelect, onNewPageClick }) => {
    const { pages } = usePagesStore();
    const { events } = useSchedulesStore();
    const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1); // Check with small tolerance
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [recentItems]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            const scrollAmount = 300; // Width of a card + gap
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    useEffect(() => {
        // Combine pages and schedules into recent items
        const items: RecentItem[] = [];

        // Add pages (using updatedAt or createdAt)
        pages.forEach(page => {
            items.push({
                id: page.id,
                type: 'page',
                title: page.title,
                date: page.updatedAt || page.createdAt,
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                ),
                data: page,
            });
        });

        // Add schedule events (using updatedAt or createdAt)
        events.forEach((event: ScheduleEvent) => {
            items.push({
                id: event.id,
                type: 'schedule',
                title: event.title || 'Untitled Event',
                date: event.updatedAt || event.createdAt,
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                ),
                data: event,
            });
        });

        // Sort by date (most recent first) and take top 12
        const sorted = items
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 12);

        setRecentItems(sorted);
    }, [pages, events]);

    const handleItemClick = (item: RecentItem) => {
        if (item.type === 'page' && onPageSelect) {
            onPageSelect(item.id);
        } else if (item.type === 'schedule' && onEventSelect) {
            onEventSelect(item.id);  // Pass event ID to open specific event
        }
    };

    const getRelativeTime = (date: Date) => {
        const now = dayjs();
        const itemDate = dayjs(date);
        const diffMinutes = now.diff(itemDate, 'minute');
        const diffHours = now.diff(itemDate, 'hour');
        const diffDays = now.diff(itemDate, 'day');

        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return itemDate.format('MMM D');
    };

    return (
        <div className="h-screen w-full overflow-y-auto bg-neutral dark:bg-primary">
            <div className="max-w-7xl mx-auto px-8 py-12">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-neutral dark:text-text-primary mb-2">
                        Welcome back! 👋
                    </h1>
                    <p className="text-text-neutral/60 dark:text-text-secondary">
                        Here's what you've been working on recently
                    </p>
                </div>

                {/* Recent Items Grid */}
                {recentItems.length === 0 ? (
                    <div className="text-center py-20">
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
                        <div className="relative group -mx-4 px-4">
                            {/* Navigation Buttons - Visible on Hover */}
                            {canScrollLeft && (
                                <Button
                                    onClick={() => scroll('left')}
                                    variant="ghost"
                                    size="icon"
                                    circle
                                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-secondary border border-secondary/10 dark:border-primary/10 p-0"
                                    aria-label="Scroll left"
                                >
                                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-secondary border border-secondary/10 dark:border-primary/10 p-0"
                                    aria-label="Scroll right"
                                >
                                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Button>
                            )}

                            {/* Scroll Container */}
                            <div
                                ref={scrollContainerRef}
                                onScroll={checkScroll}
                                className="flex overflow-x-auto gap-4 pb-4 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                            >
                                {recentItems.map((item) => (
                                    <div key={`${item.type}-${item.id}`} className="min-w-[260px] w-[260px] snap-start">
                                        <Card
                                            icon={item.icon}
                                            title={item.title}
                                            description={
                                                item.type === 'page'
                                                    ? (item.data as Page).description || 'Click to open and edit this page'
                                                    : 'Click to view event details'
                                            }
                                            type={item.type}
                                            onClick={() => handleItemClick(item)}
                                            updatedAt={getRelativeTime(item.date)}
                                            createdAt={getRelativeTime((item.data as Page | ScheduleEvent).createdAt)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Quick Actions */}
                {recentItems.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-secondary dark:border-primary">
                        <h2 className="text-sm font-bold text-text-neutral dark:text-text-secondary uppercase tracking-wider mb-4 opacity-80">
                            Quick Actions
                        </h2>
                        <div className="flex gap-3">
                            <Button
                                onClick={onScheduleClick}
                                variant="accent"
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
