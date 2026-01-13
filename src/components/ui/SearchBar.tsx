import React, { useState } from 'react';
import { SearchModal } from './SearchModal';
import type { SearchResult } from './SearchModal';

// Re-export SearchResult for convenience
export type { SearchResult };

interface SearchBarProps {
    onSearch?: (query: string) => void;
    onSelectResult?: (result: SearchResult) => void;
    results?: SearchResult[];
    placeholder?: string;
    className?: string;
    recentSearches?: string[];
    isLoading?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    onSearch = () => { },
    onSelectResult,
    results = [],
    placeholder = 'Search...',
    className = '',
    recentSearches = [],
    isLoading = false
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            {/* Search Bar - Click to open modal */}
            <button
                onClick={handleOpenModal}
                className={`flex items-center gap-3 bg-white dark:bg-secondary border border-secondary/20 dark:border-white/10 rounded-lg px-4 py-2.5 hover:border-secondary/30 dark:hover:border-white/20 transition-all duration-200 shadow-sm hover:shadow-md w-full max-w-md ${className}`}
                aria-label="Search"
            >
                {/* Search Icon */}
                <svg className="w-5 h-5 text-text-neutral/40 dark:text-text-secondary/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>

                {/* Placeholder Text */}
                <span className="flex-1 text-left text-sm text-text-neutral/40 dark:text-text-secondary/40">
                    {placeholder}
                </span>

                {/* Keyboard Hint */}
                <div className="hidden sm:flex items-center gap-1 shrink-0">
                    <kbd className="px-2 py-1 text-xs bg-neutral-100 dark:bg-secondary/50 text-text-neutral/40 dark:text-text-secondary/40 rounded border border-secondary/10">
                        ⌘K
                    </kbd>
                </div>
            </button>

            {/* Search Modal */}
            <SearchModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSearch={onSearch}
                onSelectResult={onSelectResult}
                results={results}
                placeholder={placeholder}
                recentSearches={recentSearches}
                isLoading={isLoading}
            />
        </>
    );
};
