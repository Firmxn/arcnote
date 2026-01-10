import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string; // Class for the panel container
    footer?: React.ReactNode; // Sticky footer
    noPadding?: boolean; // Remove default padding
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    className = '',
    footer,
    noPadding = false
}) => {
    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const modalContent = (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] animate-in fade-in duration-200"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[210] animate-in fade-in zoom-in-95 duration-200 w-full max-w-lg px-4 pointer-events-none">
                <div className={`bg-neutral rounded-xl shadow-2xl border border-secondary/20 pointer-events-auto w-full max-h-[85vh] flex flex-col overflow-hidden ${className}`}>
                    {title && (
                        <div className={`flex justify-between items-center shrink-0 ${noPadding ? 'px-6 py-4 border-b border-secondary/10' : 'px-6 pt-6 pb-4'}`}>
                            <h3 className="text-lg font-bold text-text-neutral">
                                {title}
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-text-neutral/50 hover:text-text-neutral transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}

                    <div className={`overflow-y-auto flex-1 ${noPadding ? '' : 'px-6 pb-6'}`}>
                        {children}
                    </div>

                    {footer && (
                        <div className="shrink-0">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    return createPortal(modalContent, document.body);
};
