import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import { CleanInput } from './CleanInput';

export interface SearchResult {
    id: string;
    title: string;
    description?: string;
    category?: string;
    icon?: React.ReactNode;
    metadata?: string;
}

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSearch: (query: string) => void;
    onSelectResult?: (result: SearchResult) => void;
    results: SearchResult[];
    placeholder?: string;
    recentSearches?: string[];
    isLoading?: boolean;
}

export const SearchModal: React.FC<SearchModalProps> = ({
    isOpen,
    onClose,
    onSearch,
    onSelectResult,
    results,
    placeholder = 'Search...',
    recentSearches = [],
    isLoading = false
}) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input saat modal dibuka
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Reset state saat modal ditutup
    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Trigger search callback saat query berubah
    useEffect(() => {
        onSearch(query);
    }, [query, onSearch]);

    // Group results by category
    const groupedResults = results.reduce((acc, result) => {
        const category = result.category || 'Results';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(result);
        return acc;
    }, {} as Record<string, SearchResult[]>);

    const allResults = results;
    const totalResults = allResults.length;

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % Math.max(totalResults, 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + totalResults) % Math.max(totalResults, 1));
        } else if (e.key === 'Enter' && totalResults > 0) {
            e.preventDefault();
            const selectedResult = allResults[selectedIndex];
            if (selectedResult && onSelectResult) {
                onSelectResult(selectedResult);
                onClose();
            }
        }
    };

    const handleResultClick = (result: SearchResult) => {
        if (onSelectResult) {
            onSelectResult(result);
        }
        onClose();
    };

    const handleRecentSearchClick = (search: string) => {
        setQuery(search);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} noPadding className="max-w-2xl">
            <div className="flex flex-col max-h-[80vh]">
                {/* Search Input */}
                <div className="px-4 py-3 border-b border-secondary/10 shrink-0">
                    <div className="flex items-center gap-3 bg-neutral-100 dark:bg-secondary/50 rounded-lg px-4 py-2.5">
                        <svg className="w-5 h-5 text-text-neutral/40 dark:text-text-secondary/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <CleanInput
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="text-text-neutral/40 hover:text-text-neutral dark:text-text-secondary/40 dark:hover:text-text-secondary transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                        <div className="text-xs text-text-neutral/30 dark:text-text-secondary/30 hidden sm:block">
                            ⌘ + K
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto">
                    {/* Recent Searches - Show when no query */}
                    {!query.trim() && recentSearches.length > 0 && (
                        <div className="px-4 py-3">
                            <h4 className="text-xs font-semibold text-text-neutral/50 dark:text-text-secondary/50 uppercase tracking-wider mb-2">
                                Recent Searches
                            </h4>
                            <div className="space-y-1">
                                {recentSearches.map((search, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleRecentSearchClick(search)}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-secondary/50 transition-colors text-left"
                                    >
                                        <svg className="w-4 h-4 text-text-neutral/40 dark:text-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-sm text-text-neutral dark:text-text-primary">{search}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && query.trim() && (
                        <div className="px-4 py-8 text-center">
                            <div className="inline-block w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-text-neutral/60 dark:text-text-secondary mt-2">Searching...</p>
                        </div>
                    )}

                    {/* No Results */}
                    {!isLoading && query.trim() && totalResults === 0 && (
                        <div className="px-4 py-8 text-center">
                            <div className="text-4xl mb-2">🔍</div>
                            <p className="text-sm text-text-neutral/60 dark:text-text-secondary">
                                No results found for "{query}"
                            </p>
                        </div>
                    )}

                    {/* Grouped Results */}
                    {!isLoading && query.trim() && totalResults > 0 && (
                        <div className="px-4 py-3">
                            {Object.entries(groupedResults).map(([category, categoryResults]) => (
                                <div key={category} className="mb-4 last:mb-0">
                                    <h4 className="text-xs font-semibold text-text-neutral/50 dark:text-text-secondary/50 uppercase tracking-wider mb-2 px-3">
                                        {category}
                                    </h4>
                                    <div className="space-y-1">
                                        {categoryResults.map((result) => {
                                            const globalIndex = allResults.indexOf(result);
                                            const isSelected = globalIndex === selectedIndex;

                                            return (
                                                <button
                                                    key={result.id}
                                                    onClick={() => handleResultClick(result)}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${isSelected
                                                        ? 'bg-accent/10 dark:bg-accent/20'
                                                        : 'hover:bg-neutral-100 dark:hover:bg-secondary/50'
                                                        }`}
                                                >
                                                    {result.icon && (
                                                        <div className="shrink-0 text-text-neutral/60 dark:text-text-secondary/60">
                                                            {result.icon}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-text-neutral dark:text-text-primary truncate">
                                                            {result.title}
                                                        </div>
                                                        {result.description && (
                                                            <div className="text-xs text-text-neutral/60 dark:text-text-secondary/60 truncate">
                                                                {result.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {result.metadata && (
                                                        <div className="text-xs text-text-neutral/40 dark:text-text-secondary/40 shrink-0">
                                                            {result.metadata}
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Hint - Desktop Only */}
                <div className="px-4 py-2 border-t border-secondary/10 shrink-0 hidden md:block">
                    <div className="flex items-center justify-between text-xs text-text-neutral/40 dark:text-text-secondary/40">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-secondary/50 rounded">↑↓</kbd>
                                Navigate
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-secondary/50 rounded">Enter</kbd>
                                Select
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-secondary/50 rounded">Esc</kbd>
                                Close
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
