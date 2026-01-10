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
        <div className="min-h-screen flex items-center justify-center bg-primary text-text-primary px-4">
            <div className="bg-neutral dark:bg-secondary rounded-2xl shadow-xl w-full max-w-md p-8 border border-white/10 relative overflow-hidden">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2 tracking-tight text-info dark:text-text-primary">ArcNote</h1>
                    <p className="text-text-neutral dark:text-text-neutral">
                        {mode === 'login' ? 'Sync your notes securely.' : 'Create secure account.'}
                    </p>
                </div>

                {error && (
                    <div className="bg-danger/10 text-text-danger p-3 rounded-lg mb-4 text-sm border border-danger/20">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="bg-success/10 text-text-success p-3 rounded-lg mb-4 text-sm border border-success/20">
                        {message}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 ml-1 text-text-neutral dark:text-text-primary">Email</label>
                        <input
                            type="email"
                            className="w-full px-4 py-2.5 rounded-xl border border-secondary/30 bg-white/50 dark:bg-primary/50 text-text-neutral dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-text-neutral/50"
                            placeholder="hello@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5 ml-1 text-text-neutral dark:text-text-primary">Password</label>
                        <input
                            type="password"
                            className="w-full px-4 py-2.5 rounded-xl border border-secondary/30 bg-white/50 dark:bg-primary/50 text-text-neutral dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-text-neutral/50"
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
                        className="w-full bg-primary hover:bg-primary/90 text-text-primary font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-text-neutral">
                    {mode === 'login' ? (
                        <>
                            New to ArcNote?{' '}
                            <button onClick={() => { setMode('register'); setError(null); setMessage(null); }} className="text-primary hover:underline font-semibold ml-1">
                                Sign up now
                            </button>
                        </>
                    ) : (
                        <>
                            Already have an account?{' '}
                            <button onClick={() => { setMode('login'); setError(null); setMessage(null); }} className="text-primary hover:underline font-semibold ml-1">
                                Sign in
                            </button>
                        </>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-secondary text-xs text-center text-text-neutral/70 space-y-3">
                    <p>Secured by Supabase Auth</p>
                    <button
                        onClick={() => {
                            if (window.confirm('Switch to Local Mode? You will access your local data instead of the cloud.')) {
                                localStorage.setItem('arcnote_storage_preference', 'local');
                                window.location.reload();
                            }
                        }}
                        className="text-text-neutral hover:text-primary transition-colors underline decoration-dotted"
                    >
                        Use Offline Mode
                    </button>
                </div>
            </div>
        </div>
    );
};
