import React, { useState, useEffect } from 'react';
import { supabase } from '../../data/supabase';
import { useNavigate } from 'react-router-dom';

export const UpdatePasswordPage = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // Check if user is authenticated (Supabase handles session recovery from URL hash automatically)
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError('Invalid or expired reset link. Please try requesting a new one.');
            }
        };
        checkSession();
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setMessage('Password updated successfully! Redirecting to home...');
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-white dark:bg-primary overflow-y-auto text-text-neutral dark:text-text-primary">
            <div className="min-h-screen py-12 flex flex-col items-center justify-center px-4">
                <div className="w-full max-w-[420px] md:max-w-[480px] md:bg-neutral md:dark:bg-secondary md:shadow-2xl md:rounded-3xl md:p-8 md:border md:border-neutral-200 md:dark:border-white/5 transition-all duration-300">

                    <div className="text-center mb-10 md:mb-6">
                        <div className="w-16 h-16 md:w-14 md:h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-4">
                            <svg className="w-8 h-8 md:w-8 md:h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl md:text-2xl font-bold mb-2 md:mb-1 tracking-tight text-text-neutral dark:text-white">
                            Set New Password
                        </h1>
                        <p className="text-text-neutral/60 dark:text-text-secondary text-sm md:text-xs">
                            Please enter your new password below.
                        </p>
                    </div>

                    <div className="space-y-4 mb-6 md:mb-4">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 md:p-3 rounded-2xl text-sm text-center border border-red-100 dark:border-red-900/30">
                                {error}
                            </div>
                        )}
                        {message && (
                            <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 md:p-3 rounded-2xl text-sm text-center border border-green-100 dark:border-green-900/30">
                                {message}
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-5 md:space-y-4">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-text-neutral/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <input
                                type="password"
                                className="w-full pl-12 pr-5 py-3.5 md:py-3 rounded-full border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 text-text-neutral dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all placeholder:text-text-neutral/40 text-sm md:text-base"
                                placeholder="New Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-3.5 md:py-3 rounded-full shadow-lg shadow-accent/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-base md:text-sm"
                        >
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>

                    <div className="pt-8 md:pt-6 text-center pb-2 md:pb-0">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-xs text-text-neutral/40 hover:text-text-neutral dark:text-text-secondary hover:underline focus:outline-none transition-colors"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
