import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { Dropdown } from '../ui/Dropdown';
import type { TransactionType, TransactionCategory } from '../../types/finance';


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

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [type, setType] = useState<TransactionType>('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<TransactionCategory>('Food & Dining');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [error, setError] = useState('');
    const formRef = React.useRef<HTMLFormElement>(null);

    // Auto-scroll to bottom when datepicker opens
    React.useEffect(() => {
        if (showDatePicker && formRef.current) {
            // Delay sedikit agar transisi padding sempat terjadi
            setTimeout(() => {
                formRef.current?.scrollTo({
                    top: formRef.current.scrollHeight,
                    behavior: 'smooth'
                });
            }, 180);
        }
    }, [showDatePicker]);

    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    // Update category saat type berubah
    React.useEffect(() => {
        if (type === 'income') {
            setCategory('Salary');
        } else {
            setCategory('Food & Dining');
        }
    }, [type]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        const amountNum = parseFloat(amount);
        if (!amount || isNaN(amountNum) || amountNum <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (!category) {
            setError('Please select a category');
            return;
        }

        if (!date) {
            setError('Please select a date');
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

            // Reset form
            setAmount('');
            setDescription('');
            setDate(new Date());
            onClose();
        } catch (err) {
            setError('Failed to add transaction');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-secondary rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-white dark:bg-secondary border-b border-gray-200 dark:border-primary/20 px-6 py-4 flex items-center justify-between shrink-0">
                    <h2 className="text-xl font-bold text-text-neutral dark:text-text-primary">
                        Add Transaction
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-text-neutral/60 dark:text-text-secondary hover:text-text-neutral dark:hover:text-text-primary transition-colors"
                        disabled={isSubmitting}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form - Scrollable */}
                <form ref={formRef} onSubmit={handleSubmit} className="overflow-y-auto flex-1">
                    <div className={`px-6 pt-6 space-y-5 transition-all duration-300 ease-in-out ${showDatePicker ? 'pb-96' : isCategoryOpen ? 'pb-40' : 'pb-6'}`}>
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
                                    step="1000"
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
                    </div>
                </form>

                {/* Actions - Sticky Footer */}
                <div className="bg-white dark:bg-secondary border-t border-gray-200 dark:border-primary/20 px-6 py-4 flex gap-3 shrink-0">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="accent"
                        isLoading={isSubmitting}
                        className="flex-1"
                        onClick={(e) => {
                            e.preventDefault();
                            const form = e.currentTarget.closest('div')?.previousElementSibling as HTMLFormElement;
                            form?.requestSubmit();
                        }}
                    >
                        {isSubmitting ? 'Adding...' : 'Add Transaction'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
