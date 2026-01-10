import React from 'react';
import { Badge } from './Badge';

interface CardProps {
    icon: React.ReactNode;
    title: React.ReactNode;
    description: string;
    badge?: string; // Badge text (e.g., "2 subpages")
    createdAt?: string;
    updatedAt?: string;
    type?: 'page' | 'schedule';
    onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
    icon,
    title,
    description,
    badge,
    createdAt,
    updatedAt,
    type = 'page',
    onClick
}) => {
    return (
        <button
            onClick={onClick}
            className="group relative bg-white dark:bg-secondary rounded-2xl p-6 text-left transition-all hover:shadow-lg hover:-translate-y-1 shadow-sm w-full"
        >
            {/* Icon in rounded square */}
            <div className="mb-4">
                <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center text-text-neutral dark:text-text-primary
                    ${type === 'page'
                        ? 'bg-primary/10 dark:bg-primary/20'
                        : 'bg-accent/10 dark:bg-accent/20'
                    }
                `}>
                    {icon}
                </div>
            </div>

            {/* Title */}
            <h3 className="font-bold text-lg text-text-neutral dark:text-text-primary mb-2 line-clamp-1">
                {title}
            </h3>

            {/* Description */}
            <p
                className="text-sm text-text-neutral/60 dark:text-text-secondary mb-3 line-clamp-1"
                title={description}
            >
                {description}
            </p>

            {/* Badge (e.g., subpage count) */}
            {badge && (
                <div className="mb-4">
                    <Badge
                        color={type === 'page' ? 'primary' : 'accent'}
                        variant="soft"
                        size="sm"
                    >
                        {badge}
                    </Badge>
                </div>
            )}

            {/* Metadata - Dates */}
            {(createdAt || updatedAt) && (
                <div className="flex flex-col gap-1.5 text-xs text-text-neutral/50 dark:text-text-secondary">
                    {updatedAt && (
                        <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Updated {updatedAt}</span>
                        </div>
                    )}
                    {createdAt && (
                        <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Created {createdAt}</span>
                        </div>
                    )}
                </div>
            )}
        </button>
    );
};
