import React from 'react';
import dayjs from 'dayjs';
import type { ScheduleEvent } from '../../types/schedule';

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
    // Generate multiple weeks for horizontal scroll (2 weeks before, current week, 2 weeks after)
    const currentWeekStart = selectedDate.startOf('week').add(1, 'day'); // Start from Monday
    const weeksToShow = 5; // Total weeks to display
    const centerWeekIndex = 2; // Current week is in the middle

    // Generate dates for multiple weeks
    const allDates: dayjs.Dayjs[] = [];
    for (let weekOffset = -centerWeekIndex; weekOffset < weeksToShow - centerWeekIndex; weekOffset++) {
        const weekStart = currentWeekStart.add(weekOffset * 7, 'day');
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            allDates.push(weekStart.add(dayOffset, 'day'));
        }
    }

    // Filter events for selected date
    const dayEvents = events.filter(e => dayjs(e.date).isSame(selectedDate, 'day'));

    // Generate time slots (00:00 - 23:00)
    const timeSlots = Array.from({ length: 24 }, (_, i) => i);

    // Helper to get events at specific hour
    const getEventsAtHour = (hour: number) => {
        return dayEvents.filter(e => {
            const eventHour = dayjs(e.date).hour();
            return eventHour === hour;
        });
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header: Day Name with Swipe Indicator */}
            <div className="px-4 py-3 bg-neutral dark:bg-primary">
                <p className="text-sm text-text-neutral/60 dark:text-text-secondary">
                    {selectedDate.format('dddd')}
                </p>
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-text-neutral dark:text-text-primary">
                        {selectedDate.format('MMMM YYYY')}
                    </h2>
                    {/* Swipe Indicator */}
                    <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-text-neutral/40 dark:text-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-text-neutral/20 dark:bg-text-secondary/20"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-text-neutral/20 dark:bg-text-secondary/20"></div>
                        </div>
                        <svg className="w-4 h-4 text-text-neutral/40 dark:text-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Week Dates Selector - Horizontal Scroll (No Month Labels) */}
            <div className="border-b border-secondary/20">
                <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth px-4 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    {allDates.map((date) => {
                        const isSelected = date.isSame(selectedDate, 'day');
                        const isToday = date.isSame(dayjs(), 'day');

                        return (
                            <button
                                key={date.format('YYYY-MM-DD')}
                                onClick={() => onDateSelect(date)}
                                className="flex flex-col items-center gap-1 min-w-[48px] snap-center"
                            >
                                <span className="text-xs text-text-neutral/60 dark:text-text-secondary">
                                    {date.format('ddd')}
                                </span>
                                <div
                                    className={`
                                        w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                                        ${isSelected
                                            ? 'bg-accent text-white'
                                            : isToday
                                                ? 'bg-primary/10 dark:bg-accent/20 text-primary dark:text-accent'
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

            {/* Timeline View */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                {dayEvents.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-4xl mb-2">📅</div>
                        <p className="text-text-neutral/60 dark:text-text-secondary text-sm">
                            No events for this day
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {timeSlots.map((hour) => {
                            const hourEvents = getEventsAtHour(hour);
                            if (hourEvents.length === 0) return null;

                            return (
                                <div key={hour} className="flex gap-3">
                                    {/* Time Label */}
                                    <div className="w-16 shrink-0 text-sm text-text-neutral/60 dark:text-text-secondary pt-1">
                                        {String(hour).padStart(2, '0')}:00
                                    </div>

                                    {/* Events */}
                                    <div className="flex-1 space-y-2">
                                        {hourEvents.map((event) => (
                                            <button
                                                key={event.id}
                                                onClick={() => onEventClick(event.id)}
                                                className={`
                                                    w-full text-left p-3 rounded-xl transition-all
                                                    ${event.type === 'Meeting'
                                                        ? 'bg-blue-500/10 dark:bg-blue-500/20 border-l-4 border-blue-500'
                                                        : event.type === 'Task'
                                                            ? 'bg-green-500/10 dark:bg-green-500/20 border-l-4 border-green-500'
                                                            : 'bg-red-500/10 dark:bg-red-500/20 border-l-4 border-red-500'
                                                    }
                                                `}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <p className="text-xs text-text-neutral/60 dark:text-text-secondary mb-1">
                                                            {dayjs(event.date).format('HH:mm')}
                                                        </p>
                                                        <p className="font-medium text-text-neutral dark:text-text-primary">
                                                            {event.title || 'Untitled Event'}
                                                        </p>
                                                        {event.content && (
                                                            <p className="text-sm text-text-neutral/60 dark:text-text-secondary mt-1 line-clamp-2">
                                                                {event.content}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {event.attendees && event.attendees.length > 0 && (
                                                        <div className="flex -space-x-2">
                                                            {event.attendees.slice(0, 3).map((attendee, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="w-6 h-6 rounded-full bg-primary dark:bg-accent flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800"
                                                                >
                                                                    {attendee.charAt(0).toUpperCase()}
                                                                </div>
                                                            ))}
                                                            {event.attendees.length > 3 && (
                                                                <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800">
                                                                    +{event.attendees.length - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* FAB - Add Event */}
            <button
                onClick={() => onDateClick(selectedDate)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-accent hover:bg-accent-hover text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 md:hidden"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </button>
        </div>
    );
};
