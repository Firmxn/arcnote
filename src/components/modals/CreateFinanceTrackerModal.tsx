import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';

interface CreateFinanceTrackerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { title: string; description: string; currency: string }) => Promise<void>;
}

export const CreateFinanceTrackerModal: React.FC<CreateFinanceTrackerModalProps> = ({
    isOpen,
    onClose,
    onSubmit
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!title.trim()) return;

        try {
            setError(null);
            setIsLoading(true);
            await onSubmit({
                title: title.trim(),
                description: description.trim(),
                currency: 'IDR'
            });
            // Reset form
            setTitle('');
            setDescription('');
            setError(null);
            onClose();
        } catch (err: any) {
            console.error('Failed to create tracker:', err);
            setError(err.message || 'Failed to create tracker');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create Finance Tracker"
        >
            <div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-neutral dark:text-text-secondary mb-1">
                            Tracker Title
                        </label>
                        <Input
                            autoFocus={true}
                            placeholder="e.g. Personal Wallet"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                if (error) setError(null);
                            }}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-neutral dark:text-text-secondary mb-1">
                            Description (Optional)
                        </label>
                        <Input
                            placeholder="e.g. Daily expenses and savings"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSubmit();
                            }}
                        />
                    </div>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-6">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm text-text-neutral dark:text-text-secondary hover:bg-neutral-100 dark:hover:bg-white/5 rounded-md transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !title.trim()}
                        className="px-4 py-2 text-sm bg-accent hover:bg-accent-hover text-white rounded-md transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Creating...' : 'Create Tracker'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
