import React from 'react';
import clsx from 'clsx';
import dayjs from 'dayjs';

export type EventCardType = 'Meeting' | 'Task' | 'Personal' | 'Deadlines';

interface EventCardProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
    type: EventCardType;
    time: string | Date;
    title: string;
    className?: string;
}

export const EventCard: React.FC<EventCardProps> = ({
    type,
    time,
    title,
    className,
    onClick,
    ...props
}) => {
    const baseStyles = 'flex gap-2 items-stretch w-full';
    const cardStyles = 'flex-1 text-left p-3 rounded-lg transition-all hover:shadow-md active:scale-[0.98]';
    const lineStyles = 'w-1.5 rounded-full shrink-0 self-stretch';

    const typeColors = {
        Meeting: {
            // info.soft
            card: 'bg-blue-100 dark:bg-blue-900/30',
            text: 'text-blue-700 dark:text-blue-400',
            subtext: 'text-blue-600/80 dark:text-blue-400/80',
            line: 'bg-blue-500'
        },
        Task: {
            // success.soft
            card: 'bg-green-100 dark:bg-green-900/30',
            text: 'text-green-700 dark:text-green-400',
            subtext: 'text-green-600/80 dark:text-green-400/80',
            line: 'bg-green-500'
        },
        Personal: {
            // purple.soft
            card: 'bg-purple-100 dark:bg-purple-900/30',
            text: 'text-purple-700 dark:text-purple-400',
            subtext: 'text-purple-600/80 dark:text-purple-400/80',
            line: 'bg-purple-500'
        },
        Deadlines: {
            // error.soft
            card: 'bg-red-100 dark:bg-red-900/30',
            text: 'text-red-700 dark:text-red-400',
            subtext: 'text-red-600/80 dark:text-red-400/80',
            line: 'bg-red-500'
        }
    };

    const colors = typeColors[type];
    const formattedTime = typeof time === 'string' ? time : dayjs(time).format('h:mm A');

    return (
        <div className={clsx(baseStyles, className)}>
            {/* Vertical Line Indicator */}
            <div className={clsx(lineStyles, colors.line)}></div>

            {/* Event Card */}
            <button
                onClick={onClick}
                className={clsx(cardStyles, colors.card)}
                {...props}
            >
                <div className="flex flex-col gap-1">
                    <p className={clsx("text-xs font-medium", colors.subtext)}>
                        {formattedTime}
                    </p>
                    <p className={clsx("font-medium text-sm", colors.text)}>
                        {title || 'Untitled Event'}
                    </p>
                </div>
            </button>
        </div>
    );
};
