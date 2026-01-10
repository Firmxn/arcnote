import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string; // Class for the panel container
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    className = ''
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
            // Prevent body scroll? Optional but good practice.
            // document.body.style.overflow = 'hidden';
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            // document.body.style.overflow = '';
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
                <div className={`bg-neutral rounded-xl shadow-2xl border border-secondary/20 p-6 pointer-events-auto w-full max-h-[85vh] flex flex-col ${className}`}>
                    {title && (
                        <div className="flex justify-between items-center mb-4 shrink-0">
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
                    <div className="overflow-y-auto flex-1">
                        {children}
                    </div>
                </div>
            </div>
        </>
    );

    return createPortal(modalContent, document.body);
};
