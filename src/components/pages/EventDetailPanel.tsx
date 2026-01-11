import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useEditor, EditorContent } from '@tiptap/react';
import { extensions } from '../../editor/extensions';
import { DatePicker } from '../ui/DatePicker';
import { TimePicker } from '../ui/TimePicker';
import type { ScheduleEvent } from '../../types/schedule';
import { useSchedulesStore } from '../../state/schedules.store';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface EventDetailPanelProps {
    event: ScheduleEvent;
    onClose: () => void;
    isDraft?: boolean;
    onSave?: (event: Partial<ScheduleEvent>) => Promise<void>;
}



export const EventDetailPanel: React.FC<EventDetailPanelProps> = ({ event, onClose, isDraft = false, onSave }) => {
    const { updateEvent, deleteEvent } = useSchedulesStore();
    const [title, setTitle] = useState(event.title);

    // Properties State
    const [type, setType] = useState(event.type || 'Meeting');
    const [attendees, setAttendees] = useState(event.attendees?.join(', ') || '');
    const [dateStr, setDateStr] = useState(dayjs(event.date).format('YYYY-MM-DD'));
    const [startTime, setStartTime] = useState(dayjs(event.date).format('HH:mm'));
    const [endTime, setEndTime] = useState(
        event.endDate
            ? dayjs(event.endDate).format('HH:mm')
            : dayjs(event.date).add(1, 'hour').format('HH:mm')
    );

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    // Custom Properties State
    const [customProps, setCustomProps] = useState<Record<string, string>>(event.customProperties || {});
    const [isAddingProperty, setIsAddingProperty] = useState(false);
    const [newPropertyName, setNewPropertyName] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Debounce update helper
    const handleUpdate = async (updates: Partial<ScheduleEvent>) => {
        if (isDraft) return;
        await updateEvent(event.id, updates);
    };

    // Tiptap Editor
    const editor = useEditor({
        extensions,
        content: event.content || '',
        editorProps: {
            attributes: {
                class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px]',
            },
        },
        onUpdate: ({ editor }) => {
            handleUpdate({ content: editor.getHTML() });
        },
    });

    // Sync state with props
    useEffect(() => {
        setTitle(event.title);
        setType(event.type || 'Meeting');
        setAttendees(event.attendees?.join(', ') || '');
        setCustomProps(event.customProperties || {});

        const d = dayjs(event.date);
        setDateStr(d.format('YYYY-MM-DD'));
        setStartTime(d.format('HH:mm'));

        const ed = event.endDate ? dayjs(event.endDate) : d.add(1, 'hour');
        setEndTime(ed.format('HH:mm'));

        if (editor && event.content !== editor.getHTML()) {
            editor.commands.setContent(event.content || '');
        }
    }, [event.id, editor]);

    // -- Handlers --

    const handleTitleBlur = () => {
        if (title !== event.title) handleUpdate({ title });
    };

    const handleDateChange = (newDate: Date) => {
        const newDateStr = dayjs(newDate).format('YYYY-MM-DD');
        setDateStr(newDateStr);

        const updatedStart = dayjs(`${newDateStr} ${startTime}`).toDate();
        const updatedEnd = dayjs(`${newDateStr} ${endTime}`).toDate();

        handleUpdate({
            date: updatedStart,
            endDate: updatedEnd
        });
    };

    const handleTimeChange = (type: 'start' | 'end', val: string) => {
        if (type === 'start') {
            setStartTime(val);
            const updatedStart = dayjs(`${dateStr} ${val}`).toDate();
            handleUpdate({ date: updatedStart, isAllDay: false });
        } else {
            setEndTime(val);
            const updatedEnd = dayjs(`${dateStr} ${val}`).toDate();
            handleUpdate({ endDate: updatedEnd, isAllDay: false });
        }
    };

    const handleTypeChange = (newType: string) => {
        setType(newType);
        handleUpdate({ type: newType });
    };

    const handleAttendeesBlur = () => {
        const list = attendees.split(',').map(s => s.trim()).filter(Boolean);
        handleUpdate({ attendees: list });
    };

    // Custom Properties Handlers
    const handleAddProperty = () => {
        if (!newPropertyName.trim()) return;

        const updatedProps = { ...customProps, [newPropertyName]: '' };
        setCustomProps(updatedProps);
        handleUpdate({ customProperties: updatedProps });
        setNewPropertyName('');
        setIsAddingProperty(false);
    };

    const handleCustomPropertyChange = (key: string, value: string) => {
        const updatedProps = { ...customProps, [key]: value };
        setCustomProps(updatedProps);
        handleUpdate({ customProperties: updatedProps });
    };

    const handleDeleteProperty = (key: string) => {
        const updatedProps = { ...customProps };
        delete updatedProps[key];
        setCustomProps(updatedProps);
        handleUpdate({ customProperties: updatedProps });
    };

    const handleDelete = async () => {
        if (!isDraft) {
            setShowDeleteConfirm(true);
        } else {
            onClose();
        }
    };

    const confirmDelete = async () => {
        await deleteEvent(event.id);
        setShowDeleteConfirm(false);
        onClose();
    };

    const handleManualSave = async () => {
        if (!onSave) return;

        const list = attendees.split(',').map(s => s.trim()).filter(Boolean);
        const finalStart = dayjs(`${dateStr} ${startTime}`).toDate();
        const finalEnd = dayjs(`${dateStr} ${endTime}`).toDate();

        await onSave({
            title: title || 'Untitled',
            type,
            attendees: list,
            content: editor?.getHTML() || '',
            date: finalStart,
            endDate: finalEnd,
            isAllDay: false,
            customProperties: customProps,
        });
        onClose();
    };

    // Helper for Time Context
    const getTimeContext = (time: string) => {
        const hour = parseInt(time.split(':')[0], 10);
        if (hour >= 0 && hour < 6) return 'Night';
        if (hour >= 6 && hour < 12) return 'Morning';
        if (hour >= 12 && hour < 17) return 'Afternoon';
        if (hour >= 17 && hour < 21) return 'Evening';
        return 'Night'; // 21:00-23:59
    };

    // Helper to format time in 12-hour format
    const format12Hour = (time24: string) => {
        const [hourStr, minute] = time24.split(':');
        const hour24 = parseInt(hourStr, 10);
        const period = hour24 >= 12 ? 'PM' : 'AM';
        let hour12 = hour24 % 12;
        if (hour12 === 0) hour12 = 12;
        return `${hour12}:${minute} ${period}`;
    };

    return (
        <div className="flex flex-col h-full bg-neutral shadow-2xl border-l border-secondary/20 w-full max-w-full md:max-w-2xl transform transition-transform duration-300 ease-in-out">
            {/* Header */}
            <div className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4 h-12 md:h-14 border-b border-secondary/20">
                <div className="flex items-center gap-2 text-text-neutral/70 text-sm">
                    <Button onClick={onClose} variant="ghost" size="icon" className="w-auto h-auto p-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                    </Button>
                    <span>{dayjs(event.date).format('MMMM D, YYYY')}</span>
                    {isDraft && <Badge color="info" variant="soft" size="sm">New Event</Badge>}
                </div>
                <div className="flex items-center gap-2">
                    {isDraft ? (
                        <Button
                            onClick={handleManualSave}
                            size="sm"
                        >
                            Save
                        </Button>
                    ) : (
                        <Button
                            onClick={handleDelete}
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Delete Event"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </Button>
                    )}
                    <Button onClick={onClose} variant="ghost" size="icon">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-8 h-full">
                {/* Title */}
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    className="w-full text-2xl md:text-4xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-text-neutral/20 text-text-neutral mb-4 md:mb-8"
                    placeholder="Event Title"
                    autoFocus={isDraft}
                />

                <div className="space-y-1 mb-8">
                    {/* Fixed Property: Date */}
                    <div className="flex items-center py-1 group relative z-30">
                        <div className="w-32 flex items-center text-text-neutral/70 text-sm">
                            <svg className="w-4 h-4 mr-2 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            Date
                        </div>
                        <div className="flex-1 relative">
                            <DatePicker
                                value={dayjs(dateStr).toDate()}
                                onChange={handleDateChange}
                                open={showDatePicker}
                                onOpenChange={setShowDatePicker}
                                align="left"
                            >
                                <div className="text-sm text-text-neutral underline decoration-dotted underline-offset-4 cursor-pointer hover:text-primary transition-colors inline-block">
                                    {dayjs(dateStr).format('MMM D, YYYY')} ({getTimeContext(startTime)})
                                </div>
                            </DatePicker>
                        </div>
                    </div>

                    {/* Property: Time */}
                    <div className="flex items-center py-1 group relative z-20 h-8">
                        <div className="w-32 flex items-center text-text-neutral/70 text-sm">
                            <svg className="w-4 h-4 mr-2 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Time
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                            {/* Start Time */}
                            <div className="relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowStartTimePicker(!showStartTimePicker);
                                        setShowEndTimePicker(false);
                                    }}
                                    className="text-sm text-text-neutral hover:bg-black/5 dark:hover:bg-white/10 px-2 py-0.5 rounded transition-colors border border-transparent hover:border-secondary/20"
                                >
                                    {format12Hour(startTime)}
                                </button>
                                {showStartTimePicker && (
                                    <TimePicker
                                        value={startTime}
                                        onChange={(val) => handleTimeChange('start', val)}
                                        onClose={() => setShowStartTimePicker(false)}
                                    />
                                )}
                            </div>

                            <span className="text-text-neutral/50 text-xs">to</span>

                            {/* End Time */}
                            <div className="relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowEndTimePicker(!showEndTimePicker);
                                        setShowStartTimePicker(false);
                                    }}
                                    className="text-sm text-text-neutral hover:bg-black/5 dark:hover:bg-white/10 px-2 py-0.5 rounded transition-colors border border-transparent hover:border-secondary/20"
                                >
                                    {format12Hour(endTime)}
                                </button>
                                {showEndTimePicker && (
                                    <TimePicker
                                        value={endTime}
                                        onChange={(val) => handleTimeChange('end', val)}
                                        onClose={() => setShowEndTimePicker(false)}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Property: Attendees */}
                    <div className="flex items-center py-1 group z-10">
                        <div className="w-32 flex items-center text-text-neutral/70 text-sm">
                            <svg className="w-4 h-4 mr-2 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            Attendees
                        </div>
                        <div className="flex-1">
                            <input
                                type="text"
                                value={attendees}
                                onChange={(e) => setAttendees(e.target.value)}
                                onBlur={handleAttendeesBlur}
                                placeholder="Empty"
                                className="w-full bg-transparent text-sm focus:outline-none focus:bg-primary/5 rounded px-1 -ml-1 text-text-neutral"
                            />
                        </div>
                    </div>

                    {/* Property: Type */}
                    <div className="flex items-center py-1 group">
                        <div className="w-32 flex items-center text-text-neutral/70 text-sm">
                            <svg className="w-4 h-4 mr-2 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                            Type
                        </div>
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                            {['Meeting', 'Task', 'Personal', 'Deadlines'].map(opt => (
                                <Badge
                                    key={opt}
                                    onClick={() => handleTypeChange(opt)}
                                    color={type === opt ? 'accent' : 'neutral'}
                                    variant="soft"
                                    className={`cursor-pointer ${type !== opt ? 'opacity-70 hover:opacity-100' : ''}`}
                                >
                                    {opt}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Custom Properties */}
                    {Object.entries(customProps).map(([key, value]) => (
                        <div key={key} className="flex items-center py-1 group">
                            <div className="w-32 flex items-center text-text-neutral/70 text-sm">
                                <svg className="w-4 h-4 mr-2 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                                <span className="truncate">{key}</span>
                            </div>
                            <div className="flex-1 flex items-center gap-2">
                                <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => handleCustomPropertyChange(key, e.target.value)}
                                    placeholder="Empty"
                                    className="flex-1 bg-transparent text-sm focus:outline-none focus:bg-primary/5 rounded px-1 -ml-1 text-text-neutral"
                                />
                                <Button
                                    onClick={() => handleDeleteProperty(key)}
                                    variant="ghost"
                                    size="icon"
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 text-red-500 h-auto w-auto"
                                    title="Delete property"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </Button>
                            </div>
                        </div>
                    ))}

                    {/* Add Property Button/Input */}
                    {isAddingProperty ? (
                        <div className="flex items-center py-1 mt-2">
                            <div className="w-32 flex items-center text-text-neutral/70 text-sm">
                                <svg className="w-4 h-4 mr-2 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                                <input
                                    type="text"
                                    value={newPropertyName}
                                    onChange={(e) => setNewPropertyName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddProperty();
                                        if (e.key === 'Escape') { setIsAddingProperty(false); setNewPropertyName(''); }
                                    }}
                                    onBlur={() => {
                                        if (newPropertyName.trim()) handleAddProperty();
                                        else { setIsAddingProperty(false); setNewPropertyName(''); }
                                    }}
                                    placeholder="Property name"
                                    className="flex-1 bg-transparent text-sm focus:outline-none focus:bg-primary/5 rounded px-1 text-text-neutral"
                                    autoFocus
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center py-1 mt-2">
                            <Button
                                onClick={() => setIsAddingProperty(true)}
                                variant="ghost"
                                className="text-text-neutral/50 hover:text-text-neutral text-sm h-auto p-0 hover:bg-transparent"
                                leftIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
                            >
                                Add a property
                            </Button>
                        </div>
                    )}
                </div>

                <div className="border-t border-secondary/20 my-6"></div>

                <div className="editor-wrapper min-h-[300px]">
                    <EditorContent editor={editor} />
                </div>
            </div>
            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Delete Event"
                message="Are you sure you want to delete this event? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </div>
    );
};
