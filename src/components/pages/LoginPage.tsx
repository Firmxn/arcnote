import React, { useState } from 'react';
import { supabase } from '../../data/supabase';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [message, setMessage] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
                const { error, data } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;

                // Cek apakah butuh konfirmasi email
                if (data.session) {
                    // Auto logged in
                } else if (data.user) {
                    setMessage('Registration successful! Please check your email to confirm your account.');
                    setMode('login');
                    return;
                }
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-primary text-text-primary dark:text-text-secondary px-4">
            <div className="bg-white dark:bg-secondary rounded-2xl shadow-xl w-full max-w-md p-8 border border-white/5">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2 tracking-tight">ArcNote</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {mode === 'login' ? 'Sync your notes securely.' : 'Create secure account.'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm border border-red-200 dark:border-red-900/30">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-lg mb-4 text-sm border border-green-200 dark:border-green-900/30">
                        {message}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 ml-1">Email</label>
                        <input
                            type="email"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                            placeholder="hello@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5 ml-1">Password</label>
                        <input
                            type="password"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand hover:bg-brand/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-brand/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-500">
                    {mode === 'login' ? (
                        <>
                            New to ArcNote?{' '}
                            <button onClick={() => { setMode('register'); setError(null); setMessage(null); }} className="text-brand hover:underline font-semibold ml-1">
                                Sign up now
                            </button>
                        </>
                    ) : (
                        <>
                            Already have an account?{' '}
                            <button onClick={() => { setMode('login'); setError(null); setMessage(null); }} className="text-brand hover:underline font-semibold ml-1">
                                Sign in
                            </button>
                        </>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 text-xs text-center text-gray-400">
                    <p>Secured by Supabase Auth</p>
                </div>
            </div>
        </div>
    );
};
