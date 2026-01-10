import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { Dropdown } from '../ui/Dropdown';
import type { TransactionType, TransactionCategory, FinanceTransaction } from '../../types/finance';

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        type: TransactionType;
        amount: number;
        category: TransactionCategory;
        description?: string;
        date: Date;
    }) => Promise<void>;
    initialData?: FinanceTransaction;
    mode?: 'create' | 'edit';
    onDelete?: () => Promise<void>;
}

const INCOME_CATEGORIES: TransactionCategory[] = [
    'Salary',
    'Freelance',
    'Investment',
    'Gift',
    'Other Income',
];

const EXPENSE_CATEGORIES: TransactionCategory[] = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Other Expense',
];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    mode = 'create',
    onDelete
}) => {
    const [type, setType] = useState<TransactionType>('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<TransactionCategory>('Food & Dining');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [error, setError] = useState('');
    const bottomRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll logic
    useEffect(() => {
        if ((showDatePicker || isCategoryOpen) && bottomRef.current) {
            setTimeout(() => {
                bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 300);
        }
    }, [showDatePicker, isCategoryOpen]);

    // Initialize State based on Mode
    useEffect(() => {
        if (isOpen) {
            setError('');
            if (mode === 'edit' && initialData) {
                setType(initialData.type);
                setAmount(initialData.amount.toString());
                setCategory(initialData.category);
                setDescription(initialData.description || '');
                setDate(new Date(initialData.date));
            } else {
                // Reset for Create Mode
                setType('expense');
                setAmount('');
                setCategory('Food & Dining');
                setDescription('');
                setDate(new Date());
            }
        }
    }, [isOpen, initialData, mode]);

    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    // Update category saat type berubah
    useEffect(() => {
        if (!isOpen) return;

        const isCurrentCategoryValid = type === 'income'
            ? INCOME_CATEGORIES.includes(category)
            : EXPENSE_CATEGORIES.includes(category);

        if (!isCurrentCategoryValid) {
            setCategory(type === 'income' ? 'Salary' : 'Food & Dining');
        }
    }, [type, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const amountNum = parseFloat(amount);
        if (!amount || isNaN(amountNum) || amountNum <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (!category) {
            setError('Please select a category');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({
                type,
                amount: amountNum,
                category,
                description: description.trim() || undefined,
                date,
            });
            onClose();
        } catch (err) {
            setError('Failed to save transaction');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!onDelete) return;
        if (!window.confirm('Are you sure you want to delete this transaction?')) return;

        setIsDeleting(true);
        try {
            await onDelete();
            onClose();
        } catch (err) {
            setError('Failed to delete transaction');
        } finally {
            setIsDeleting(false);
        }
    };

    const footerContent = (
        <div className="bg-white dark:bg-secondary border-t border-gray-200 dark:border-primary/20 px-6 py-4 flex gap-3">
            {mode === 'edit' && onDelete && (
                <Button
                    type="button"
                    variant="ghost"
                    onClick={handleDelete}
                    isLoading={isDeleting}
                    disabled={isSubmitting}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 mr-auto"
                >
                    Delete
                </Button>
            )}

            <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting || isDeleting}
                className={mode === 'edit' ? '' : 'flex-1'}
            >
                Cancel
            </Button>
            <Button
                type="button"
                variant="accent"
                isLoading={isSubmitting}
                className={mode === 'edit' ? '' : 'flex-1'}
                onClick={(e) => {
                    handleSubmit(e);
                }}
            >
                {isSubmitting ? 'Saving...' : (mode === 'edit' ? 'Update Transaction' : 'Add Transaction')}
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'edit' ? 'Edit Transaction' : 'Add Transaction'}
            className="max-w-2xl bg-white dark:bg-secondary"
            noPadding
            footer={footerContent}
        >
            <form onSubmit={handleSubmit} className="flex-1">
                <div className="px-6 pt-6 space-y-5 pb-6">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Type Selection - Segmented Control */}
                    <div>
                        <label className="block text-sm font-medium text-text-neutral dark:text-text-primary mb-2">
                            Type
                        </label>
                        <div className="inline-flex bg-gray-100 dark:bg-primary/10 rounded-lg p-1 w-full">
                            <button
                                type="button"
                                onClick={() => setType('income')}
                                className={`
                                flex-1 py-2 px-4 rounded-md font-medium transition-all text-sm
                                ${type === 'income'
                                        ? 'bg-white dark:bg-secondary shadow-sm text-text-neutral dark:text-text-primary'
                                        : 'text-text-neutral/60 dark:text-text-secondary hover:text-text-neutral dark:hover:text-text-primary'
                                    }
                            `}
                            >
                                <span className="inline-flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Income
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('expense')}
                                className={`
                                flex-1 py-2 px-4 rounded-md font-medium transition-all text-sm
                                ${type === 'expense'
                                        ? 'bg-white dark:bg-secondary shadow-sm text-text-neutral dark:text-text-primary'
                                        : 'text-text-neutral/60 dark:text-text-secondary hover:text-text-neutral dark:hover:text-text-primary'
                                    }
                            `}
                            >
                                <span className="inline-flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                    </svg>
                                    Expense
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Amount */}
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-text-neutral dark:text-text-primary mb-2">
                                Amount (IDR)
                            </label>
                            <Input
                                id="amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                min="0"
                                step="1"
                                required
                                className="text-lg font-semibold"
                            />
                        </div>

                        {/* Category */}
                        <Dropdown
                            label="Category"
                            options={categories.map(cat => ({ value: cat, label: cat }))}
                            value={category}
                            onChange={(value) => setCategory(value as TransactionCategory)}
                            placeholder="Select a category"
                            open={isCategoryOpen}
                            onOpenChange={setIsCategoryOpen}
                        />
                    </div>

                    {/* Description - Full Width */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-text-neutral dark:text-text-primary mb-2">
                            Description (Optional)
                        </label>
                        <Input
                            id="description"
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g., Lunch at restaurant"
                            maxLength={100}
                        />
                    </div>

                    {/* Date - Full Width */}
                    <DatePicker
                        label="Date"
                        value={date}
                        onChange={setDate}
                        open={showDatePicker}
                        onOpenChange={setShowDatePicker}
                    />

                    {/* Dynamic Spacer for Auto-Scroll Target */}
                    <div className={`transition-all duration-300 ease-in-out ${showDatePicker ? 'h-72' : isCategoryOpen ? 'h-28' : 'h-0'}`} />
                    <div ref={bottomRef} />
                </div>
            </form>
        </Modal>
    );
};
