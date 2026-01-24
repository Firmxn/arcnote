import React from 'react';
import { Badge } from './Badge';

interface CardProps {
    icon: React.ReactNode;
    title: React.ReactNode;
    description: string;
    badge?: string; // Badge text (e.g., "2 subpages")
    extra?: React.ReactNode; // Optional extra content (e.g. Balance)
    createdAt?: string;
    updatedAt?: string;
    type?: 'page' | 'schedule';
    onClick?: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
}

export const Card: React.FC<CardProps> = ({
    icon,
    title,
    description,
    badge,
    extra,
    createdAt,
    updatedAt,
    type = 'page',
    onClick,
    onContextMenu
}) => {
    return (
        <button
            onClick={onClick}
            onContextMenu={onContextMenu}
            className="group relative bg-white dark:bg-secondary rounded-xl md:rounded-2xl p-3 md:p-6 text-left transition-all w-full border border-secondary/10 dark:border-white/5 hover:border-secondary/20 dark:hover:border-white/10"
        >
            {/* Container untuk content agar padding seimbang */}
            <div className="flex flex-col h-full justify-between min-h-[136px] md:min-h-0">
                {/* Icon - lebih besar di mobile */}
                <div className="mb-3 md:mb-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-accent/10 dark:bg-accent/20 flex items-center justify-center text-accent [&>svg]:w-5 [&>svg]:h-5 md:[&>svg]:w-6 md:[&>svg]:h-6">
                        {icon}
                    </div>
                </div>

                {/* Container untuk text content (title, balance, updated at) - spacing lebih rapat */}
                <div className="flex flex-col gap-1">
                    {/* Title - lebih kecil, rata kiri */}
                    <h3
                        className="font-semibold text-xs md:text-base text-text-neutral dark:text-text-primary line-clamp-1"
                        title={typeof title === 'string' ? title : undefined}
                    >
                        {typeof title === 'string' && title.length > 15
                            ? `${title.slice(0, 15)}...`
                            : title
                        }
                    </h3>

                    {/* Description - tampilkan di mobile dan desktop */}
                    <p
                        className="text-[10px] md:text-sm text-text-neutral/50 dark:text-text-secondary/70 line-clamp-1"
                        title={description}
                    >
                        {typeof description === 'string' && description.length > 20
                            ? `${description.slice(0, 20)}...`
                            : description
                        }
                    </p>

                    {/* Badge (e.g., subpage count) */}
                    {badge && (
                        <div className="mb-2 md:mb-4">
                            <Badge
                                color={type === 'page' ? 'primary' : 'accent'}
                                variant="soft"
                                size="sm"
                            >
                                {badge}
                            </Badge>
                        </div>
                    )}

                    {/* Extra Content (Balance) - rata kiri, ukuran besar */}
                    {extra && (
                        <div className="[&>div]:text-lg [&>div]:md:text-2xl [&>div]:font-bold">
                            {extra}
                        </div>
                    )}

                    {/* Metadata - Mobile: tampilkan updated at atau created at, rata kiri */}
                    {(createdAt || updatedAt) && (
                        <>
                            {/* Mobile: satu baris saja (updated at prioritas, fallback ke created at) */}
                            <div className="flex md:hidden items-center gap-1 text-[9px] text-text-neutral/50 dark:text-text-secondary">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>{updatedAt || createdAt}</span>
                            </div>

                            {/* Desktop: tampilkan keduanya */}
                            <div className="hidden md:flex flex-col gap-1.5 text-xs text-text-neutral/50 dark:text-text-secondary">
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
                        </>
                    )}
                </div>
            </div>
        </button>
    );
};
