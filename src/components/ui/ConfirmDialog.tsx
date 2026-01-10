import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

type DialogType = 'warning' | 'danger' | 'info';

interface ConfirmDialogProps {
    isOpen?: boolean; // Optional untuk backward compatibility
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: DialogType; // 'warning' | 'danger' | 'info'
    danger?: boolean; // Backward compatibility - maps to type='danger'
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen = true, // Default true untuk backward compatibility dengan DatePicker/MonthYearPicker
    title,
    message,
    confirmText = 'Continue',
    cancelText = 'Cancel',
    type: typeProp,
    danger = false,
    onConfirm,
    onCancel
}) => {
    // Determine type based on props
    const type: DialogType = typeProp || (danger ? 'danger' : 'warning');

    // Don't render if not open
    if (!isOpen) return null;

    // Icon based on type
    const getIcon = () => {
        switch (type) {
            case 'danger':
                return (
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                );
            case 'info':
                return (
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
            case 'warning':
            default:
                return (
                    <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                );
        }
    };

    // Button style based on type


    // Default title based on type
    const getDefaultTitle = () => {
        switch (type) {
            case 'danger':
                return 'Confirm Action';
            case 'info':
                return 'Information';
            case 'warning':
            default:
                return 'Past Date Selected';
        }
    };

    const dialogContent = (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] animate-in fade-in duration-200"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[210] animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-neutral rounded-lg shadow-2xl border border-secondary/20 p-6 w-[400px] max-w-[90vw]">
                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                        {getIcon()}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-text-neutral text-center mb-2">
                        {title || getDefaultTitle()}
                    </h3>

                    {/* Message */}
                    <p className="text-sm text-text-neutral/70 text-center mb-6">
                        {message}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            onClick={onCancel}
                            variant="outline"
                            className="flex-1"
                        >
                            {cancelText}
                        </Button>
                        <Button
                            onClick={onConfirm}
                            variant={type === 'danger' ? 'error' : type === 'info' ? 'info' : 'primary'}
                            className="flex-1"
                        >
                            {confirmText}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );

    // Use portal to render at document.body level to avoid z-index and overflow issues
    return createPortal(dialogContent, document.body);
};
