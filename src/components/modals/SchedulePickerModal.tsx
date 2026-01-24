import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface SchedulePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SchedulePickerModal: React.FC<SchedulePickerModalProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [currentMonth, setCurrentMonth] = useState(dayjs());

    const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);

    // Reset selection when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedDate(null);
            // Optional: Reset view to current month too?
            // setCurrentMonth(dayjs()); 
            // It's usually better to keep user's last view or reset it. Let's reset selection primarily.
        }
    }, [isOpen]);

    // Calendar Generation Logic
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

    const handleDateClick = (date: dayjs.Dayjs) => {
        setSelectedDate(date);
    };

    const handleConfirm = () => {
        if (selectedDate) {
            navigate(`/schedule?action=create&date=${selectedDate.toISOString()}`);
            onClose();
        }
    };

    const handlePrevMonth = () => setCurrentMonth(currentMonth.subtract(1, 'month'));
    const handleNextMonth = () => setCurrentMonth(currentMonth.add(1, 'month'));

    const handleToday = () => {
        const today = dayjs();
        setCurrentMonth(today);
        setSelectedDate(today);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select Date for Event">
            <div className="p-1">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={handlePrevMonth}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-white/10 rounded-full transition-colors text-text-neutral dark:text-text-primary"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <span className="text-lg font-semibold text-text-neutral dark:text-text-primary">
                        {currentMonth.format('MMMM YYYY')}
                    </span>
                    <button
                        onClick={handleNextMonth}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-white/10 rounded-full transition-colors text-text-neutral dark:text-text-primary"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 mb-2 text-center">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                        <div key={d} className="text-sm font-medium text-text-neutral/50 dark:text-text-secondary">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {calendar.map((date) => {
                        const isCurrentMonth = date.month() === currentMonth.month();
                        const isToday = date.isSame(dayjs(), 'day');
                        const isSelected = selectedDate ? date.isSame(selectedDate, 'day') : false;

                        return (
                            <button
                                key={date.toString()}
                                onClick={() => handleDateClick(date)}
                                className={`
                                    h-10 w-10 rounded-full flex items-center justify-center text-sm transition-all
                                    ${!isCurrentMonth ? 'text-text-neutral/30 dark:text-text-secondary/30' : 'text-text-neutral dark:text-text-primary'}
                                    ${isToday && !isSelected ? 'bg-primary/10 text-primary font-bold border border-primary/20' : ''}
                                    ${isSelected ? 'bg-primary text-white font-bold shadow-md scale-105' : 'hover:bg-neutral-100 dark:hover:bg-white/5'}
                                `}
                            >
                                {date.date()}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-6 flex justify-end">
                    {selectedDate ? (
                        <Button variant="primary" onClick={handleConfirm} className="w-full">
                            Create Event on {selectedDate.format('MMM D')}
                        </Button>
                    ) : (
                        <Button variant="ghost" onClick={handleToday} className="w-full">
                            Jump to Today
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
};
