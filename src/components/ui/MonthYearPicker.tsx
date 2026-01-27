import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import dayjs from 'dayjs';

interface MonthYearPickerProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date;
    onChange: (date: Date) => void;
    minDate?: Date;
    maxDate?: Date;
}

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
    isOpen,
    onClose,
    selectedDate,
    onChange
}) => {
    const [viewDate, setViewDate] = useState(dayjs(selectedDate));

    if (!isOpen) return null;

    const currentYear = viewDate.year();
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const handleYearChange = (increment: number) => {
        setViewDate(viewDate.add(increment, 'year'));
    };

    const handleMonthSelect = (monthIndex: number) => {
        const newDate = viewDate.month(monthIndex).toDate();
        onChange(newDate);
        onClose();
    };

    const modalContent = (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-secondary w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 bg-neutral-50 dark:bg-white/5 border-b border-neutral-100 dark:border-white/5 flex justify-between items-center">
                    <button
                        onClick={() => handleYearChange(-1)}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5 text-text-neutral dark:text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <span className="text-lg font-bold font-mono text-primary dark:text-white">
                        {currentYear}
                    </span>

                    <button
                        onClick={() => handleYearChange(1)}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5 text-text-neutral dark:text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Months Grid */}
                <div className="p-4 grid grid-cols-3 gap-3">
                    {months.map((month, index) => {
                        const isSelected = dayjs(selectedDate).year() === currentYear && dayjs(selectedDate).month() === index;
                        const isCurrentMonth = dayjs().year() === currentYear && dayjs().month() === index;

                        return (
                            <button
                                key={month}
                                onClick={() => handleMonthSelect(index)}
                                className={`
                                    py-3 rounded-xl text-sm font-semibold transition-all duration-200
                                    ${isSelected
                                        ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                                        : 'hover:bg-neutral-100 dark:hover:bg-white/5 text-text-neutral dark:text-text-secondary hover:scale-105'
                                    }
                                    ${isCurrentMonth && !isSelected ? 'border-2 border-primary/20 bg-primary/5 text-primary' : ''}
                                `}
                            >
                                {month}
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-neutral-100 dark:border-white/5 flex justify-center">
                    <button
                        onClick={() => {
                            const now = new Date();
                            onChange(now);
                            setViewDate(dayjs(now));
                            onClose();
                        }}
                        className="text-xs font-semibold text-primary dark:text-accent hover:underline"
                    >
                        Reset to Current Month
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
