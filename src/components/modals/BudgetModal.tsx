/**
 * BudgetModal Component
 * Modal untuk create/edit budget
 */

import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dropdown } from '../ui/Dropdown';
import { useFinanceStore } from '../../state/finance.store';
import type { Budget, BudgetPeriod, CreateBudgetInput } from '../../types/finance';

interface BudgetModalProps {
    isOpen: boolean;
    onClose: () => void;
    budget?: Budget; // Jika ada, mode edit
}

const PERIOD_OPTIONS = [
    { value: 'weekly', label: 'Mingguan' },
    { value: 'monthly', label: 'Bulanan' },
    { value: 'yearly', label: 'Tahunan' }
];

export default function BudgetModal({ isOpen, onClose, budget }: BudgetModalProps) {
    const { createBudget, updateBudget } = useFinanceStore();
    const isEditMode = !!budget;

    const [formData, setFormData] = useState<CreateBudgetInput>({
        title: '',
        targetAmount: 0,
        period: 'monthly',
        description: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPeriodOpen, setIsPeriodOpen] = useState(false);

    // Populate form jika edit mode
    useEffect(() => {
        if (isOpen) {
            if (budget) {
                setFormData({
                    title: budget.title,
                    targetAmount: budget.targetAmount,
                    period: budget.period,
                    description: budget.description || '',
                    categoryFilter: budget.categoryFilter
                });
            } else {
                // Reset form untuk create mode
                setFormData({
                    title: '',
                    targetAmount: 0,
                    period: 'monthly',
                    description: ''
                });
            }
            setErrors({});
        }
    }, [budget, isOpen]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Nama budget wajib diisi';
        } else if (formData.title.length > 100) {
            newErrors.title = 'Nama budget maksimal 100 karakter';
        }

        if (formData.targetAmount <= 0) {
            newErrors.targetAmount = 'Target amount harus lebih dari 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);
        try {
            if (isEditMode && budget) {
                await updateBudget(budget.id, formData);
            } else {
                await createBudget(formData);
            }
            onClose();
        } catch (error: any) {
            setErrors({ submit: error.message || 'Gagal menyimpan budget' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (field: keyof CreateBudgetInput, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error untuk field ini
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const footerContent = (
        <div className="bg-white dark:bg-secondary border-t border-gray-200 dark:border-primary/20 px-6 py-4 flex gap-3">
            <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
            >
                Batal
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
                {isSubmitting ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Buat Budget')}
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? 'Edit Budget' : 'Buat Budget Baru'}
            className="max-w-2xl bg-white dark:bg-secondary"
            noPadding
            footer={footerContent}
        >
            <form onSubmit={handleSubmit} className="flex-1">
                <div className="px-6 pt-6 space-y-5 pb-6">
                    {/* Error Message */}
                    {errors.submit && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
                            {errors.submit}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-text-neutral dark:text-text-primary mb-2">
                            Nama Budget *
                        </label>
                        <Input
                            id="title"
                            type="text"
                            placeholder="e.g., Kopi, Transportasi, Belanja Bulanan"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            maxLength={100}
                            autoFocus
                        />
                        {errors.title && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
                        )}
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Target Amount */}
                        <div>
                            <label htmlFor="targetAmount" className="block text-sm font-medium text-text-neutral dark:text-text-primary mb-2">
                                Target Amount (IDR) *
                            </label>
                            <Input
                                id="targetAmount"
                                type="number"
                                placeholder="500000"
                                value={formData.targetAmount || ''}
                                onChange={(e) => handleChange('targetAmount', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="1000"
                                className="text-lg font-semibold"
                            />
                            {errors.targetAmount && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.targetAmount}</p>
                            )}
                        </div>

                        {/* Period */}
                        <Dropdown
                            label="Periode *"
                            options={PERIOD_OPTIONS}
                            value={formData.period}
                            onChange={(value) => handleChange('period', value as BudgetPeriod)}
                            placeholder="Pilih periode"
                            open={isPeriodOpen}
                            onOpenChange={setIsPeriodOpen}
                        />
                    </div>

                    {/* Description - Full Width */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-text-neutral dark:text-text-primary mb-2">
                            Deskripsi (Opsional)
                        </label>
                        <Input
                            id="description"
                            type="text"
                            placeholder="Catatan tambahan tentang budget ini..."
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            maxLength={200}
                        />
                    </div>
                </div>
            </form>
        </Modal>
    );
}
