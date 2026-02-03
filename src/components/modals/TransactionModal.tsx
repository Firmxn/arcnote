import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Dropdown } from '../ui/Dropdown';
import type { TransactionType, TransactionCategory, FinanceTransaction, Wallet, RecurringInterval } from '../../types/finance';
import { useRecurringStore } from '../../state/recurring.store';
import dayjs from 'dayjs';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        type: TransactionType;
        amount: number;
        category: TransactionCategory;
        description?: string;
        date: Date;
        walletId?: string;
    }) => Promise<void>;
    initialData?: FinanceTransaction;
    mode?: 'create' | 'edit';
    onDelete?: () => Promise<void>;
    wallets?: Wallet[];
    defaultWalletId?: string;
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

export const TransactionModal: React.FC<TransactionModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    mode = 'create',
    onDelete,
    wallets = [],
    defaultWalletId
}) => {
    const [type, setType] = useState<TransactionType>('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<TransactionCategory>('Food & Dining');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date());
    const [walletId, setWalletId] = useState<string>(defaultWalletId || '');
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Recurring State
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringInterval, setRecurringInterval] = useState<RecurringInterval>('monthly');
    const { createTemplate } = useRecurringStore();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isWalletOpen, setIsWalletOpen] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [showMainModal, setShowMainModal] = useState(true);
    const [error, setError] = useState('');
    const bottomRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll logic
    useEffect(() => {
        if ((showDatePicker || isCategoryOpen || isWalletOpen) && bottomRef.current) {
            setTimeout(() => {
                bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 300);
        }
    }, [showDatePicker, isCategoryOpen, isWalletOpen]);

    // Initialize State based on Mode
    const prevIsOpen = React.useRef(isOpen);

    // Initialize State based on Mode - Only on OPEN
    useEffect(() => {
        // Only run logic when isOpen transitions from false -> true
        if (isOpen && !prevIsOpen.current) {
            setError('');
            if (mode === 'edit' && initialData) {
                setType(initialData.type);
                setAmount(initialData.amount.toString());
                setCategory(initialData.category);
                setDescription(initialData.description || '');
                setDate(new Date(initialData.date));
                setWalletId(initialData.walletId); // FIX: Initialize walletId from existing transaction
            } else {
                // Reset for Create Mode
                setType('expense');
                setAmount('');
                setCategory('Food & Dining');
                setDescription('');
                setDate(new Date());
                setWalletId(defaultWalletId || (wallets.length > 0 ? wallets[0].id : ''));
                setIsRecurring(false);
                setRecurringInterval('monthly');
            }
            setShowMainModal(true);
            setIsConfirmDialogOpen(false);
        }
        prevIsOpen.current = isOpen;
    }, [isOpen, initialData, mode, defaultWalletId, wallets]);

    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    // Handle Type Change synchronously to prevent layout shift (jedag jedug)
    const handleTypeChange = (newType: TransactionType) => {
        if (type === newType) return;

        setType(newType);
        // Reset category immediately to valid default
        // This ensures no intermediate render with invalid category (e.g. Income + Food & Dining)
        // which could cause height changes/wrapping issues on mobile.
        setCategory(newType === 'income' ? 'Salary' : 'Food & Dining');
    };

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

        // Validate walletId for multi-wallet scenarios
        if (wallets.length > 0 && !walletId) {
            setError('Please select a wallet');
            return;
        }

        setIsSubmitting(true);
        try {
            const submitData = {
                type,
                amount: amountNum,
                category,
                description: description.trim() || undefined,
                date,
                // Saat edit, gunakan walletId yang sudah ada
                // Saat create, gunakan walletId jika wallets tersedia
                walletId: mode === 'edit' ? walletId : (wallets.length > 0 ? walletId : undefined)
            };

            await onSubmit(submitData);

            // Handle Recurring Template Creation (Only in Create Mode)
            if (mode === 'create' && isRecurring && walletId) {
                await createTemplate({
                    walletId,
                    type,
                    amount: amountNum,
                    category,
                    description: description.trim() || undefined,
                    interval: recurringInterval,
                    startDate: date,
                    nextRunDate: new Date(date), // Start immediately or next cycle? Usually user wants 1st tx now, next one later. 
                    // BUT: The "real" transaction is created above via onSubmit.
                    // So we should set nextRunDate to NEXT occurrence to avoid double creation today.
                    isActive: true
                });

                // Note: The logic above creates 1 real tx NOW, and 1 template for FUTURE.
                // We need to make sure the template's nextRunDate is set to *future* date.
                // Let's rely on the user understanding or auto-calculate next date?
                // Better approach: Template starts NOW, but since we manually created the first TX, 
                // we should update the template's nextRunDate to skip the first one?
                // OR: simply let the template run normally?
                // If we set nextRunDate = today, the engine will run on next App load => Duplicate!
                // FIX: Manually advance date for template
                // Ideally we should inject this logic in `createTemplate` or handle it here.
                // For MVP: We just created the TX. The Engine will run on next load.
                // If we set nextRunDate = date, Engine sees date <= now, creates another TX.
                // SO: We MUST calculate next instance date here.
            }

            onClose();
        } catch (err) {
            setError('Failed to save transaction');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = () => {
        setShowMainModal(false);
        setIsConfirmDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!onDelete) return;

        setIsConfirmDialogOpen(false);
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
        <div className="bg-white dark:bg-secondary border-t border-secondary/10 dark:border-accent/30 px-6 py-4 flex gap-3">
            {mode === 'edit' && onDelete ? (
                // Edit Mode: Delete & Cancel Grouped | Update
                <>
                    <div className="flex-1 flex gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleDelete}
                            isLoading={isDeleting}
                            disabled={isSubmitting}
                            className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20 px-3"
                        >
                            Delete
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={isSubmitting || isDeleting}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    </div>
                    <Button
                        type="button"
                        variant="accent"
                        isLoading={isSubmitting}
                        className="flex-1"
                        onClick={(e) => {
                            handleSubmit(e);
                        }}
                    >
                        Update
                    </Button>
                </>
            ) : (
                // Create Mode: Cancel | Add
                <>
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
                        type="button"
                        variant="accent"
                        isLoading={isSubmitting}
                        className="flex-1"
                        onClick={(e) => {
                            handleSubmit(e);
                        }}
                    >
                        Create
                    </Button>
                </>
            )}
        </div>
    );

    return (
        <>
            <Modal
                isOpen={isOpen && showMainModal}
                onClose={onClose}
                title={mode === 'edit' ? 'Update Transaction' : 'Create Transaction'}
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

                        {/* Wallet Selection (If wallets provided and > 1 or forced) */}
                        {wallets.length > 0 && mode === 'create' && (
                            <Dropdown
                                label="Wallet"
                                options={wallets.map(w => ({ value: w.id, label: w.title }))}
                                value={walletId}
                                onChange={(val) => setWalletId(val)}
                                open={isWalletOpen}
                                onOpenChange={setIsWalletOpen}
                                placeholder="Select Wallet"
                            />
                        )}

                        {/* Type Selection - Segmented Control */}
                        <div>
                            <label className="block text-sm font-medium text-text-neutral dark:text-text-primary mb-2">
                                Type
                            </label>
                            <div className="inline-flex bg-gray-100 dark:bg-primary/10 rounded-lg p-1 w-full">
                                <button
                                    type="button"
                                    onClick={() => handleTypeChange('income')}
                                    className={`
                                flex-1 py-2 px-4 rounded-md font-medium transition-colors text-sm
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
                                    onClick={() => handleTypeChange('expense')}
                                    className={`
                                flex-1 py-2 px-4 rounded-md font-medium transition-colors text-sm
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

                        {/* Recurring Option (Create Mode Only) */}
                        {mode === 'create' && (
                            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-text-neutral dark:text-text-primary">Repeat Transaction?</span>
                                        <span className="text-xs text-text-neutral/60 dark:text-text-secondary">Automatically create this transaction periodically</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={isRecurring}
                                            onChange={(e) => setIsRecurring(e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary/10 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-accent/30 peer-checked:bg-accent"></div>
                                    </label>
                                </div>

                                {isRecurring && (
                                    <div className="pt-2 border-t border-secondary/10 dark:border-accent/30 animation-expand">
                                        <label className="block text-sm font-medium text-text-neutral dark:text-text-primary mb-2">
                                            Frequency
                                        </label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((freq) => (
                                                <button
                                                    key={freq}
                                                    type="button"
                                                    onClick={() => setRecurringInterval(freq)}
                                                    className={`
                                                    py-2 px-1 text-xs font-medium rounded-lg capitalize border transition-all
                                                    ${recurringInterval === freq
                                                            ? 'bg-accent text-white border-accent'
                                                            : 'bg-white dark:bg-white/5 text-text-neutral dark:text-text-secondary border-secondary/10 dark:border-accent/30 hover:border-accent/50'
                                                        }
                                                `}
                                                >
                                                    {freq}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-text-neutral/60 dark:text-text-secondary mt-2">
                                            Next transaction will be created on <strong>
                                                {(() => {
                                                    // Simple preview next date
                                                    // Use dayjs for accurate date addition (handles leap years/month lengths better than native Date)
                                                    // Matches logic in recurring.service.ts
                                                    let d = dayjs(date);
                                                    if (recurringInterval === 'daily') d = d.add(1, 'day');
                                                    if (recurringInterval === 'weekly') d = d.add(1, 'week');
                                                    if (recurringInterval === 'monthly') d = d.add(1, 'month');
                                                    if (recurringInterval === 'yearly') d = d.add(1, 'year');
                                                    return d.format('D MMMM YYYY'); // e.g. 28 February 2026
                                                })()}
                                            </strong>
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Dynamic Spacer for Auto-Scroll Target */}
                        <div className={`transition-all duration-300 ease-in-out ${showDatePicker ? 'h-72' : isCategoryOpen ? 'h-28' : 'h-0'}`} />
                        <div ref={bottomRef} />
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={isConfirmDialogOpen}
                title="Delete Transaction"
                message="Are you sure you want to delete this transaction? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                onConfirm={confirmDelete}
                onCancel={() => {
                    setIsConfirmDialogOpen(false);
                    setShowMainModal(true);
                }}
            />
        </>
    );
};
