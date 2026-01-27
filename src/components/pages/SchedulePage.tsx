import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useSchedulesStore } from '../../state/schedules.store';
import type { ScheduleEvent } from '../../types/schedule';
import { EventDetailPanel } from './EventDetailPanel';
import { ScheduleMobileView } from './ScheduleMobileView';
import { MonthYearPicker } from '../ui/MonthYearPicker';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';


interface SchedulePageProps {
    initialEventId?: string | null;
}

import { useSearchParams } from 'react-router-dom';

export const SchedulePage: React.FC<SchedulePageProps> = ({ initialEventId }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { events, loadEvents, createEvent, updateEvent: _updateEvent, deleteEvent, markEventAsVisited, archiveEvent: _archiveEvent } = useSchedulesStore();
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [selectedDate, setSelectedDate] = useState(dayjs()); // Untuk mobile day view
    const [selectedEventId, setSelectedEventId] = useState<string | null>(initialEventId || null);
    const [draftEvent, setDraftEvent] = useState<Partial<ScheduleEvent> | null>(null);
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const [pendingDate, setPendingDate] = useState<dayjs.Dayjs | null>(null);
    const [eventToDelete, setEventToDelete] = useState<string | null>(null);


    // Detect mobile screen size
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (initialEventId) {
            setSelectedEventId(initialEventId);
            // Also update current date to match the event date if needed
            const event = events.find(e => e.id === initialEventId && !e.isArchived);
            if (event) {
                setCurrentDate(dayjs(event.date));
                setSelectedDate(dayjs(event.date));
            }
        }
    }, [initialEventId, events]);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    // Calendar Helper
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    const startOfWeek = startOfMonth.startOf('week');
    const endOfWeek = endOfMonth.endOf('week');

    const calendarDays = [];
    let day = startOfWeek;
    while (day.isBefore(endOfWeek)) {
        calendarDays.push(day);
        day = day.add(1, 'day');
    }

    const handleDateClick = (date: dayjs.Dayjs) => {
        const isPast = date.isBefore(dayjs(), 'day');

        if (isPast) {
            // Show confirmation dialog
            setPendingDate(date);
            setConfirmMessage(`You selected ${date.format('MMM D, YYYY')}, which is in the past. Do you want to create an event for this date?`);
            setShowConfirm(true);
        } else {
            // Proceed normally for future dates
            createDraftEvent(date);
        }
    };

    const createDraftEvent = (date: dayjs.Dayjs) => {
        // Notion Style: Click date -> Open Detail for DRAFT
        setDraftEvent({
            id: 'draft',
            title: '',
            date: date.toDate(),
            isAllDay: true,
            type: 'Meeting', // Default type
            content: '',
            attendees: []
        });
        setSelectedEventId(null);
    };

    // Handle URL params for creating event
    useEffect(() => {
        const action = searchParams.get('action');
        const dateParam = searchParams.get('date');

        if (action === 'create' && dateParam) {
            const targetDate = dayjs(dateParam);
            if (targetDate.isValid()) {
                // Determine if we should warn about past date
                const isPast = targetDate.isBefore(dayjs(), 'day');

                // For this automatic flow, maybe we skip confirmation or show it?
                // Use confirmation logic just to be safe/consistent
                if (isPast) {
                    setPendingDate(targetDate);
                    setConfirmMessage(`You selected ${targetDate.format('MMM D, YYYY')}, which is in the past. Do you want to create an event for this date?`);
                    setShowConfirm(true);
                } else {
                    createDraftEvent(targetDate);
                }

                // Update current view to that month
                setCurrentDate(targetDate);

                // Clear params so it doesn't re-trigger on simple refresh? 
                // Using replace: true to clean URL
                setSearchParams({}, { replace: true });
            }
        }
    }, [searchParams, setSearchParams]);

    const handleConfirm = () => {
        if (pendingDate) {
            createDraftEvent(pendingDate);
        }
        setShowConfirm(false);
        setPendingDate(null);
    };

    const handleCancelConfirm = () => {
        setShowConfirm(false);
        setPendingDate(null);
    };

    const handleEventClick = (e: React.MouseEvent, eventId: string) => {
        e.stopPropagation();
        markEventAsVisited(eventId);
        setSelectedEventId(eventId);
        setDraftEvent(null);
    };

    const handleCloseDetail = () => {
        setSelectedEventId(null);
        setDraftEvent(null);
    };

    const handleSaveDraft = async (data: Partial<ScheduleEvent>) => {
        try {
            await createEvent({
                title: data.title || 'Untitled',
                date: data.date!,
                isAllDay: true,
                type: data.type,
                attendees: data.attendees,
                content: data.content
            });
            setDraftEvent(null);
            // Optional: setSelectedEventId(newEvent.id) if we want to keep viewing it
        } catch (error) {
            console.error(error);
        }
    };

    const activeEvent = events.find(e => e.id === selectedEventId);

    const handleEditFromList = (event: ScheduleEvent) => {
        markEventAsVisited(event.id);
        setSelectedEventId(event.id);
        setDraftEvent(null);
    };

    const handleDeleteFromList = (event: ScheduleEvent) => {
        setEventToDelete(event.id);
    };

    const executeDelete = async () => {
        if (eventToDelete) {
            await deleteEvent(eventToDelete);
            setEventToDelete(null);
        }
    };

    // Determine what to show in panel: existing event OR draft event
    const panelEvent = activeEvent || (draftEvent as ScheduleEvent);
    const isDraft = !!draftEvent;

    return (
        <div className="flex-1 h-full flex flex-col bg-neutral text-text-neutral relative overflow-hidden max-w-full min-h-0">
            {/* Mobile Day View */}
            {isMobile ? (
                <>
                    <ScheduleMobileView
                        selectedDate={selectedDate}
                        currentDate={currentDate}
                        events={events}
                        onDateSelect={setSelectedDate}
                        onEventClick={(eventId) => {
                            markEventAsVisited(eventId);
                            setSelectedEventId(eventId);
                            setDraftEvent(null);
                        }}
                        onDateClick={handleDateClick}
                        onEditEvent={handleEditFromList}
                        onDeleteEvent={handleDeleteFromList}
                    />
                </>
            ) : (
                <>
                    {/* Desktop Calendar View - Header Toolbar */}
                    <div className="flex items-center justify-between px-4 md:px-8 py-[1.6vh] md:py-[1.65vh] border-b border-secondary/20 bg-neutral/95 backdrop-blur-sm sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Button
                                    variant="ghost"
                                    className="flex items-center gap-2 text-xl md:text-2xl font-bold cursor-pointer hover:text-primary hover:dark:text-accent transition-colors group px-0 h-auto hover:bg-transparent"
                                    onClick={() => setShowMonthPicker(!showMonthPicker)}
                                    rightIcon={
                                        <svg
                                            className={`w-5 h-5 transition-transform duration-200 ${showMonthPicker ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7-7-7 7" />
                                        </svg>
                                    }
                                >
                                    <span>{currentDate.format('MMMM YYYY')}</span>
                                </Button>
                                {showMonthPicker && (
                                    <MonthYearPicker
                                        isOpen={showMonthPicker}
                                        selectedDate={currentDate.toDate()}
                                        onChange={(date) => setCurrentDate(dayjs(date))}
                                        onClose={() => setShowMonthPicker(false)}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Desktop Calendar Grid */}
                    <div className="flex-1 p-4 md:p-8 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                        <div className="max-w-7xl mx-auto">
                            <div className="grid grid-cols-7 gap-px bg-secondary/20 border border-secondary/20 rounded-lg overflow-hidden min-h-[500px] md:min-h-[600px]">
                                {/* Headers */}
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                                    <div key={d} className="bg-neutral p-2 md:p-3 text-center text-xs md:text-sm font-semibold text-text-neutral/70 border-b border-secondary/10">
                                        {d}
                                    </div>
                                ))}

                                {/* Days */}
                                {calendarDays.map((dateItem) => {
                                    const isCurrentMonth = dateItem.month() === currentDate.month();
                                    const isToday = dateItem.isSame(dayjs(), 'day');
                                    const isPast = dateItem.isBefore(dayjs(), 'day');
                                    const dayEvents = events.filter(e => dayjs(e.date).isSame(dateItem, 'day'));

                                    return (
                                        <div
                                            key={dateItem.toString()}
                                            onClick={() => handleDateClick(dateItem)}
                                            className={`
                                            min-h-[80px] md:min-h-[100px] p-1.5 md:p-2 cursor-pointer transition-colors flex flex-col relative
                                            ${!isCurrentMonth ? 'bg-neutral/50' :
                                                    isPast ? 'bg-neutral/80' :
                                                        'bg-neutral'}
                                            ${!isCurrentMonth ? 'text-text-neutral/30' :
                                                    isPast && !isToday ? 'text-text-neutral/30' :
                                                        ''}
                                            ${!isPast && isCurrentMonth && !isToday ? 'hover:bg-primary/5' : ''}
                                        `}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`
                                                w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full text-[10px] md:text-xs font-medium
                                                ${isToday ? 'bg-accent text-white' : ''}
                                            `}>
                                                    {dateItem.date()}
                                                </span>
                                            </div>

                                            <div className="space-y-1 flex-1">
                                                {dayEvents.map(event => (
                                                    <Badge
                                                        key={event.id}
                                                        onClick={(e: React.MouseEvent) => handleEventClick(e, event.id)}

                                                        variant="soft"
                                                        size="sm"
                                                        color={
                                                            event.type === 'Meeting' ? 'info' :
                                                                event.type === 'Task' ? 'success' :
                                                                    event.type === 'Deadlines' ? 'error' :
                                                                        event.type === 'Personal' ? 'purple' :
                                                                            'neutral'
                                                        }
                                                        className="w-full justify-start truncate mb-1"
                                                    >
                                                        {event.title || 'Untitled'}
                                                    </Badge>
                                                ))}
                                            </div>
                                            {/* Hover Add Button could go here */}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Event Detail Side Peek (Overlay) */}
            {panelEvent && (
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-40 flex justify-end">
                    <div
                        className="h-full w-full max-w-none md:max-w-2xl lg:max-w-3xl animate-in slide-in-from-right duration-300"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking panel
                    >
                        <EventDetailPanel
                            event={panelEvent}
                            onClose={handleCloseDetail}
                            isDraft={isDraft}
                            onSave={handleSaveDraft}
                        />
                    </div>
                    {/* Click outside to close */}
                    <div className="flex-1" onClick={handleCloseDetail} />
                </div>
            )}

            {/* Confirmation Dialog for Past Dates */}
            <ConfirmDialog
                isOpen={showConfirm}
                message={confirmMessage}
                onConfirm={handleConfirm}
                onCancel={handleCancelConfirm}
            />

            <ConfirmDialog
                isOpen={!!eventToDelete}
                title="Delete Event"
                message="Are you sure you want to delete this event? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                onConfirm={executeDelete}
                onCancel={() => setEventToDelete(null)}
            />
            {/* Context Menu */}

        </div>
    );
};
