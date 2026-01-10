import React, { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { usePagesStore } from '../../state/pages.store';

interface PagesSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPageSelect: (pageId: string) => void;
}

export const PagesSearchModal: React.FC<PagesSearchModalProps> = ({ isOpen, onClose, onPageSelect }) => {
    const { pages } = usePagesStore();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredPages = useMemo(() => {
        if (!searchQuery.trim()) return pages;
        const query = searchQuery.toLowerCase();
        return pages.filter(p =>
            (p.title || 'Untitled').toLowerCase().includes(query)
        );
    }, [pages, searchQuery]);

    const handleSelect = (pageId: string) => {
        onPageSelect(pageId);
        onClose();
        setSearchQuery(''); // Reset logic if needed, though unmount usually handles it
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Search Pages">
            {/* Search Input */}
            <div className="mb-4 mx-0.5">
                <Input
                    leftIcon={(
                        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    )}
                    placeholder="Type to search pages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="sm:text-sm"
                />
            </div>

            {/* Results List */}
            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                {filteredPages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        No pages found matching "{searchQuery}"
                    </div>
                ) : (
                    filteredPages.map(page => (
                        <button
                            key={page.id}
                            onClick={() => handleSelect(page.id)}
                            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-3 transition-all group"
                        >
                            <span className="opacity-50 group-hover:opacity-100 text-text-neutral transition-opacity">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-text-neutral truncate">
                                    {page.title || 'Untitled'}
                                </div>
                                <div className="text-xs text-text-neutral/50 truncate">
                                    Created {new Date(page.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            <span className="opacity-0 group-hover:opacity-60 text-xs text-text-neutral transition-opacity">
                                Open
                            </span>
                        </button>
                    ))
                )}
            </div>
        </Modal>
    );
};
