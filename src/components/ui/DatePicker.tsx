import React, { useState } from 'react';
import dayjs from 'dayjs';
import { ConfirmDialog } from './ConfirmDialog';

interface DatePickerProps {
    value: Date;
    onChange: (date: Date) => void;
    onClose: () => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, onClose }) => {
    const [currentMonth, setCurrentMonth] = useState(dayjs(value));
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [pendingDate, setPendingDate] = useState<dayjs.Dayjs | null>(null);

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
        onClose();
    };

    const handleDateClick = (date: dayjs.Dayjs) => {
        const isPast = date.isBefore(dayjs(), 'day');

        if (isPast) {
            // Show confirmation dialog
            setPendingDate(date);
            setConfirmMessage(`You selected ${date.format('MMM D, YYYY')}, which is in the past. Do you want to continue?`);
            setShowConfirm(true);
        } else {
            // Proceed normally
            onChange(date.toDate());
            onClose();
        }
    };

    const handleConfirm = () => {
        if (pendingDate) {
            onChange(pendingDate.toDate());
            onClose();
        }
        setShowConfirm(false);
        setPendingDate(null);
    };

    const handleCancel = () => {
        setShowConfirm(false);
        setPendingDate(null);
    };

    return (
        <>
            <div
                className="absolute top-full left-0 mt-2 z-50 p-4 rounded-lg bg-neutral border border-secondary/20 shadow-xl w-64 animate-in fade-in zoom-in-95 duration-200"
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
                        className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                        Select Today
                    </button>
                </div>

                {/* Backdrop for closing when clicking outside (transparent) */}
                <div className="fixed inset-0 -z-10" onClick={onClose} />
            </div>

            {/* Confirmation Dialog */}
            {showConfirm && (
                <ConfirmDialog
                    message={confirmMessage}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </>
    );
};
