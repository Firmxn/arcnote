import React, { useEffect, useRef, useState } from 'react';

interface TimePickerProps {
    value: string; // Format "HH:mm" (24-hour)
    onChange: (time: string) => void; // Returns "HH:mm" (24-hour)
    onClose: () => void;
}

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, onClose }) => {
    const listRef = useRef<HTMLDivElement>(null);

    // Convert 24h to 12h format for display
    const convert24to12 = (time24: string): { time12: string; period: 'AM' | 'PM' } => {
        const [hourStr, minute] = time24.split(':');
        const hour24 = parseInt(hourStr, 10);
        const period: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM';
        let hour12 = hour24 % 12;
        if (hour12 === 0) hour12 = 12;
        return { time12: `${hour12.toString().padStart(2, '0')}:${minute}`, period };
    };

    // Convert 12h to 24h format
    const convert12to24 = (time12: string, period: 'AM' | 'PM'): string => {
        const [hourStr, minute] = time12.split(':');
        let hour = parseInt(hourStr, 10);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        return `${hour.toString().padStart(2, '0')}:${minute}`;
    };

    const { time12: initialTime12, period: initialPeriod } = convert24to12(value);
    const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(initialPeriod);

    // Generate 12-hour time slots (every 30 mins)
    const timeSlots12: string[] = [];
    for (let i = 12; i <= 12; i++) { // Start with 12
        timeSlots12.push(`${i.toString().padStart(2, '0')}:00`);
        timeSlots12.push(`${i.toString().padStart(2, '0')}:30`);
    }
    for (let i = 1; i < 12; i++) { // Then 1-11
        timeSlots12.push(`${i.toString().padStart(2, '0')}:00`);
        timeSlots12.push(`${i.toString().padStart(2, '0')}:30`);
    }

    // Scroll to selected time on mount
    useEffect(() => {
        if (listRef.current) {
            const selectedEl = listRef.current.querySelector('[data-selected="true"]');
            if (selectedEl) {
                selectedEl.scrollIntoView({ block: 'center' });
            }
        }
    }, []);

    const handleTimeSelect = (time12: string) => {
        const time24 = convert12to24(time12, selectedPeriod);
        onChange(time24);
        onClose();
    };

    const handlePeriodToggle = (period: 'AM' | 'PM') => {
        setSelectedPeriod(period);
        // Auto-update time with new period
        const time24 = convert12to24(initialTime12, period);
        onChange(time24);
    };

    return (
        <div
            className="absolute top-full left-0 mt-2 z-50 w-48 bg-neutral border border-secondary/20 shadow-xl rounded-lg animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
        >
            {/* AM/PM Toggle */}
            <div className="flex border-b border-secondary/20 p-2 gap-1">
                <button
                    onClick={() => handlePeriodToggle('AM')}
                    className={`
                        flex-1 py-1.5 rounded text-xs font-medium transition-colors
                        ${selectedPeriod === 'AM'
                            ? 'bg-primary text-white'
                            : 'text-text-neutral/70 hover:bg-black/5 dark:hover:bg-white/5'}
                    `}
                >
                    AM
                </button>
                <button
                    onClick={() => handlePeriodToggle('PM')}
                    className={`
                        flex-1 py-1.5 rounded text-xs font-medium transition-colors
                        ${selectedPeriod === 'PM'
                            ? 'bg-primary text-white'
                            : 'text-text-neutral/70 hover:bg-black/5 dark:hover:bg-white/5'}
                    `}
                >
                    PM
                </button>
            </div>

            {/* Time List */}
            <div
                ref={listRef}
                className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary/20 hover:scrollbar-thumb-secondary/40"
            >
                <div className="py-1">
                    {timeSlots12.map((time12) => {
                        const time24 = convert12to24(time12, selectedPeriod);
                        const isSelected = time24 === value;
                        return (
                            <button
                                key={time12}
                                data-selected={isSelected}
                                onClick={() => handleTimeSelect(time12)}
                                className={`
                                    w-full text-left px-4 py-2 text-sm transition-colors
                                    ${isSelected
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-text-neutral hover:bg-black/5 dark:hover:bg-white/5'}
                                `}
                            >
                                {time12}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Invisible backdrop */}
            <div className="fixed inset-0 -z-10" onClick={onClose} />
        </div>
    );
};
