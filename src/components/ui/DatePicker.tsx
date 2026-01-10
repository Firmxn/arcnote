import React, { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { ConfirmDialog } from './ConfirmDialog';

interface DatePickerProps {
    value: Date;
    onChange: (date: Date) => void;
    label?: string;
    align?: 'left' | 'right'; // Horizontal alignment
    disabled?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: React.ReactNode;
}

export const DatePicker: React.FC<DatePickerProps> = ({
    value,
    onChange,
    label,
    align = 'right',
    disabled = false,
    open,
    onOpenChange,
    children,
}) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalIsOpen;

    const handleOpenChange = (newOpen: boolean) => {
        if (!isControlled) {
            setInternalIsOpen(newOpen);
        }
        onOpenChange?.(newOpen);
    };

    const [currentMonth, setCurrentMonth] = useState(dayjs(value));
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [pendingDate, setPendingDate] = useState<dayjs.Dayjs | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);



    // Close when clicking outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target as Node) &&
                !document.getElementById('confirm-dialog')?.contains(event.target as Node) // Prevent closing when dialog is clicked
            ) {
                handleOpenChange(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Generate days
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startWeek = startOfMonth.startOf('week');
    const endWeek = endOfMonth.endOf('week');

    const calendar = [];
    let day = startWeek;
    while (day.isBefore(endWeek)) {
        calendar.push(day);
        day = day.add(1, 'day');
    }

    const handlePrevMonth = () => setCurrentMonth(currentMonth.subtract(1, 'month'));
    const handleNextMonth = () => setCurrentMonth(currentMonth.add(1, 'month'));
    const handleToday = () => {
        const today = dayjs();
        setCurrentMonth(today);
        onChange(today.toDate());
        handleOpenChange(false);
    };

    const handleDateClick = (date: dayjs.Dayjs) => {
        const isPast = date.isBefore(dayjs(), 'day');

        if (isPast) {
            setPendingDate(date);
            setConfirmMessage(`You selected ${date.format('MMM D, YYYY')}, which is in the past. Do you want to continue?`);
            setShowConfirm(true);
        } else {
            onChange(date.toDate());
            handleOpenChange(false);
        }
    };

    const handleConfirm = () => {
        if (pendingDate) {
            onChange(pendingDate.toDate());
            handleOpenChange(false);
        }
        setShowConfirm(false);
        setPendingDate(null);
    };

    const handleCancel = () => {
        setShowConfirm(false);
        setPendingDate(null);
    };

    return (
        <div
            ref={wrapperRef}
            className={`
                relative transition-all duration-300 ease-in-out
            `}
        >
            {/* Label */}
            {label && (
                <label className="block text-sm font-medium text-text-neutral dark:text-text-primary mb-2">
                    {label}
                </label>
            )}

            {children ? (
                <div onClick={() => !disabled && handleOpenChange(!isOpen)}>
                    {children}
                </div>
            ) : (
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={() => !disabled && handleOpenChange(!isOpen)}
                    disabled={disabled}
                    className={`
                        w-full px-3 py-2.5 rounded-lg text-left flex items-center justify-between
                        transition-all
                        bg-white dark:bg-secondary/20 shadow-sm
                        text-text-neutral dark:text-text-primary
                        !outline-none !ring-0
                        ${showConfirm ? 'z-0' : ''} 
                        ${isOpen ? 'ring-2 ring-accent' : ''}
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                >
                    <span>{dayjs(value).format('MMM D, YYYY')}</span>
                    <svg className="w-5 h-5 text-text-neutral/50 dark:text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </button>
            )}

            {/* Calendar Popup */}
            {isOpen && (
                <div
                    ref={pickerRef}
                    className={`
                        absolute z-50 p-4 rounded-lg bg-neutral dark:bg-secondary border border-secondary/20 shadow-xl w-64 animate-in fade-in zoom-in-95 duration-200
                        ${align === 'left' ? 'left-0' : 'right-0'}
                        top-full mt-2
                    `}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={handlePrevMonth}
                            className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded text-text-neutral/70 hover:text-text-neutral transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div className="text-sm font-semibold text-text-neutral">
                            {currentMonth.format('MMMM YYYY')}
                        </div>
                        <button
                            onClick={handleNextMonth}
                            className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded text-text-neutral/70 hover:text-text-neutral transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    {/* Weekdays */}
                    <div className="grid grid-cols-7 mb-2 text-center">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                            <div key={d} className="text-xs font-medium text-text-neutral/50">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendar.map((dateItem) => {
                            const isCurrentMonth = dateItem.month() === currentMonth.month();
                            const isSelected = dateItem.isSame(dayjs(value), 'day');
                            const isToday = dateItem.isSame(dayjs(), 'day');
                            const isPast = dateItem.isBefore(dayjs(), 'day');

                            return (
                                <button
                                    key={dateItem.toString()}
                                    onClick={() => handleDateClick(dateItem)}
                                    className={`
                                        h-8 w-8 rounded-full flex items-center justify-center text-sm transition-all relative
                                        ${!isCurrentMonth ? 'text-text-neutral/20' : 'text-text-neutral'}
                                        ${isPast && isCurrentMonth ? 'opacity-40 hover:opacity-60' : ''}
                                        ${isSelected
                                            ? 'bg-primary text-white font-bold shadow-md transform scale-105'
                                            : 'hover:bg-secondary/20'}
                                        ${isToday && !isSelected ? 'text-primary font-bold bg-primary/10' : ''}
                                    `}
                                    title={isPast && !isToday ? 'Past date' : ''}
                                >
                                    <span className={isPast && !isSelected && isCurrentMonth ? 'line-through decoration-1' : ''}>
                                        {dateItem.date()}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-secondary/20 flex justify-center">
                        <button
                            onClick={handleToday}
                            className="text-xs font-medium text-accent hover:text-primary/80 transition-colors"
                        >
                            Select Today
                        </button>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog */}
            {showConfirm && (
                <div id="confirm-dialog">
                    <ConfirmDialog
                        message={confirmMessage}
                        onConfirm={handleConfirm}
                        onCancel={handleCancel}
                    />
                </div>
            )}
        </div>
    );
};
