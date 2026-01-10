import React, { useState } from 'react';
import dayjs from 'dayjs';
import { ConfirmDialog } from './ConfirmDialog';

interface MonthYearPickerProps {
    currentDate: dayjs.Dayjs;
    onChange: (date: dayjs.Dayjs) => void;
    onClose: () => void;
}

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ currentDate, onChange, onClose }) => {
    const [selectedYear, setSelectedYear] = useState(currentDate.year());
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [pendingDate, setPendingDate] = useState<dayjs.Dayjs | null>(null);

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const handleMonthClick = (monthIndex: number) => {
        const newDate = dayjs().year(selectedYear).month(monthIndex).date(1);
        const isPast = newDate.isBefore(dayjs(), 'month');

        if (isPast) {
            // Show confirmation dialog
            setPendingDate(newDate);
            setConfirmMessage(`You selected ${newDate.format('MMMM YYYY')}, which is in the past. Do you want to continue?`);
            setShowConfirm(true);
        } else {
            // Proceed normally
            onChange(newDate);
            onClose();
        }
    };

    const handleConfirm = () => {
        if (pendingDate) {
            onChange(pendingDate);
            onClose();
        }
        setShowConfirm(false);
        setPendingDate(null);
    };

    const handleCancel = () => {
        setShowConfirm(false);
        setPendingDate(null);
    };

    const handleYearChange = (direction: 'prev' | 'next') => {
        setSelectedYear(prev => direction === 'prev' ? prev - 1 : prev + 1);
    };

    // Generate mini calendar dots for each month
    const getMonthDots = (monthIndex: number) => {
        const monthStart = dayjs().year(selectedYear).month(monthIndex).startOf('month');
        const daysInMonth = monthStart.daysInMonth();
        const startDay = monthStart.day(); // 0 = Sunday

        const dots = [];
        // Add empty dots for offset
        for (let i = 0; i < startDay; i++) {
            dots.push(<div key={`empty-${i}`} className="w-1 h-1" />);
        }
        // Add actual day dots
        for (let i = 1; i <= daysInMonth; i++) {
            dots.push(
                <div
                    key={i}
                    className="w-1 h-1 rounded-full bg-text-neutral/30"
                />
            );
        }
        return dots.slice(0, 35); // Max 5 weeks
    };

    const isCurrentMonth = (monthIndex: number) => {
        return currentDate.month() === monthIndex && currentDate.year() === selectedYear;
    };

    return (
        <>
            <div
                className="absolute top-full left-0 mt-2 z-50 p-4 rounded-lg bg-neutral border border-secondary/20 shadow-xl w-[420px] animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Year Switcher */}
                <div className="flex items-center justify-center gap-4 mb-4 pb-3 border-b border-secondary/20">
                    <button
                        onClick={() => handleYearChange('prev')}
                        className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded text-text-neutral/70 hover:text-text-neutral transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="text-lg font-semibold text-text-neutral min-w-[80px] text-center">
                        {selectedYear}
                    </div>
                    <button
                        onClick={() => handleYearChange('next')}
                        className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded text-text-neutral/70 hover:text-text-neutral transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>

                {/* Month Grid */}
                <div className="grid grid-cols-3 gap-2">
                    {months.map((month, index) => {
                        const isCurrent = isCurrentMonth(index);
                        const monthDate = dayjs().year(selectedYear).month(index);
                        const isPastMonth = monthDate.isBefore(dayjs(), 'month');

                        return (
                            <button
                                key={month}
                                onClick={() => handleMonthClick(index)}
                                className={`
                                    p-3 rounded-lg transition-all text-left
                                    ${isCurrent
                                        ? 'bg-primary text-white shadow-md'
                                        : 'hover:bg-black/5 dark:hover:bg-white/5 text-text-neutral'}
                                    ${isPastMonth && !isCurrent ? 'opacity-50 hover:opacity-70' : ''}
                                `}
                                title={isPastMonth && !isCurrent ? 'Past month' : ''}
                            >
                                <div className="font-medium text-sm mb-2">{month}</div>
                                {/* Mini Calendar Dots */}
                                <div className="grid grid-cols-7 gap-0.5">
                                    {getMonthDots(index)}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Backdrop */}
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
