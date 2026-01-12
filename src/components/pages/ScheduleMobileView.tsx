import React, { useMemo, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import type { ScheduleEvent } from '../../types/schedule';
import { EventCard } from '../ui/EventCard';

interface ScheduleMobileViewProps {
    selectedDate: dayjs.Dayjs;
    currentDate: dayjs.Dayjs;
    events: ScheduleEvent[];
    onDateSelect: (date: dayjs.Dayjs) => void;
    onEventClick: (eventId: string) => void;
    onDateClick: (date: dayjs.Dayjs) => void;
}

export const ScheduleMobileView: React.FC<ScheduleMobileViewProps> = ({
    selectedDate,
    events,
    onDateSelect,
    onEventClick,
    onDateClick
}) => {
    // Generate multiple weeks for horizontal scroll - use today as base to keep it stable
    const allDates = useMemo(() => {
        const today = dayjs();
        const baseWeekStart = today.startOf('week').add(1, 'day'); // Start from Monday
        const weeksToShow = 26; // Total weeks to display (~6 months: 3 months before + 3 months after)
        const centerWeekIndex = 13; // Current week is in the middle (13 weeks before, current week, 13 weeks after)

        const dates: dayjs.Dayjs[] = [];
        for (let weekOffset = -centerWeekIndex; weekOffset < weeksToShow - centerWeekIndex; weekOffset++) {
            const weekStart = baseWeekStart.add(weekOffset * 7, 'day');
            for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
                dates.push(weekStart.add(dayOffset, 'day'));
            }
        }
        return dates;
    }, []); // Empty dependency array - only calculate once on mount

    // Ref for scroll container
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Scroll to selected date when it changes (centering it)
    useEffect(() => {
        if (scrollContainerRef.current) {
            const index = allDates.findIndex(date => date.isSame(selectedDate, 'day'));

            if (index !== -1) {
                const container = scrollContainerRef.current;
                const buttonWidth = 48; // min-w-[48px]
                const gap = 12; // gap-3 = 12px
                const itemWidth = buttonWidth + gap;
                const containerWidth = container.clientWidth;

                // Center logic:
                // Position of item center = (index * itemWidth) + (itemWidth / 2)
                // Viewport center = containerWidth / 2
                // Scroll needed = Item Center - Viewport Center

                const scrollPosition = (index * itemWidth) - (containerWidth / 2) + (itemWidth / 2);

                container.scrollTo({
                    left: scrollPosition,
                    behavior: 'smooth'
                });
            }
        }
    }, [selectedDate, allDates]);

    // Initial scroll is handled by the above effect since selectedDate is set on mount


    // Scroll to previous/next week
    const scrollToWeek = (direction: 'prev' | 'next') => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const buttonWidth = 48; // min-w-[48px]
            const gap = 12; // gap-3 = 0.75rem = 12px
            const weekWidth = 7 * (buttonWidth + gap); // 7 days per week

            const scrollAmount = direction === 'prev' ? -weekWidth : weekWidth;

            container.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Filter events for selected date
    const dayEvents = events.filter(e => dayjs(e.date).isSame(selectedDate, 'day'));



    return (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Header: Day Name with Swipe Indicator - Fixed Width */}
            <div className="shrink-0 w-full px-4 py-3 bg-neutral dark:bg-primary">
                <p className="text-sm text-text-neutral/60 dark:text-text-secondary">
                    {selectedDate.format('dddd')}
                </p>
                <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xl font-bold text-text-neutral dark:text-text-primary flex-1 min-w-0 truncate">
                        {selectedDate.format('MMMM YYYY')}
                    </h2>
                    {/* Swipe Indicator */}
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onClick={() => scrollToWeek('prev')}
                            className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors"
                            aria-label="Previous week"
                        >
                            <svg className="w-4 h-4 text-text-neutral/40 dark:text-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-text-neutral/20 dark:bg-text-secondary/20"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-text-neutral/20 dark:bg-text-secondary/20"></div>
                        </div>
                        <button
                            onClick={() => scrollToWeek('next')}
                            className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors"
                            aria-label="Next week"
                        >
                            <svg className="w-4 h-4 text-text-neutral/40 dark:text-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Week Dates Selector - Horizontal Scroll (No Month Labels) - Fixed Width */}
            <div className="shrink-0 w-full border-b border-secondary/20 overflow-hidden">
                <div ref={scrollContainerRef} className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth px-8 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    {allDates.map((date) => {
                        const isSelected = date.isSame(selectedDate, 'day');
                        const isToday = date.isSame(dayjs(), 'day');

                        return (
                            <button
                                key={date.format('YYYY-MM-DD')}
                                onClick={() => onDateSelect(date)}
                                className="flex flex-col items-center gap-1 min-w-[48px] snap-center shrink-0"
                            >
                                <span className="text-xs text-text-neutral/60 dark:text-text-secondary">
                                    {date.format('ddd')}
                                </span>
                                <div
                                    className={`
                                        w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                                        ${isSelected
                                            ? 'bg-accent text-white shadow-lg shadow-accent/30'
                                            : isToday
                                                ? 'bg-primary dark:bg-secondary text-white shadow-md shadow-primary/20 dark:shadow-secondary/20'
                                                : 'text-text-neutral dark:text-text-secondary hover:bg-neutral-100 dark:hover:bg-white/5'
                                        }
                                    `}
                                >
                                    {date.date()}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Timeline View - Event List with Top/Bottom Time Labels */}
            <div className="flex-1 overflow-y-auto bg-neutral px-4 pt-6 pb-[100px] flex flex-col min-h-0">
                {dayEvents.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center pb-20">
                        <div className="text-6xl mb-4">
                            🗓️
                        </div>
                        <h3 className="text-xl font-semibold text-text-neutral dark:text-text-primary mb-2">
                            No events for this day
                        </h3>
                        <p className="text-text-neutral/60 dark:text-text-secondary cursor-pointer" onClick={() => onDateClick(selectedDate)}>
                            Tap + to add an event
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {dayEvents.map((event) => {
                            const start = dayjs(event.date);
                            const end = event.endDate ? dayjs(event.endDate) : start.add(1, 'hour');

                            return (
                                <div key={event.id} className="flex gap-4 border-b border-text-neutral/10 dark:border-white/5 pb-6 last:border-0 last:pb-0">
                                    {/* Left Side: Start & End Time */}
                                    <div className="w-16 shrink-0 flex flex-col justify-between py-1 text-right">
                                        <span className="text-xs font-medium text-text-neutral/60 dark:text-text-secondary/70 leading-tight">
                                            {start.format('h:mm A')}
                                        </span>
                                        <span className="text-xs font-medium text-text-neutral/60 dark:text-text-secondary/70 leading-tight">
                                            {end.format('h:mm A')}
                                        </span>
                                    </div>

                                    {/* Right Side: Event Card */}
                                    <div className="flex-1 relative">
                                        <EventCard
                                            type={(event.type === 'Meeting' || event.type === 'Task' || event.type === 'Personal') ? event.type : 'Deadlines'}
                                            time={event.date}
                                            title={event.title}
                                            onClick={() => onEventClick(event.id)}
                                            className="min-h-[80px]"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

        </div >
    );
};
