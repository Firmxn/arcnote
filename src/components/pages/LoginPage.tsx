import React, { useState } from 'react';
import { supabase } from '../../data/supabase';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { useNavigate } from 'react-router-dom';
import { syncManager } from '../../lib/sync';

export const LoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [message, setMessage] = useState<string | null>(null);

    const performPostLoginSync = async () => {
        setMessage('Syncing your data...');
        try {
            await syncManager.sync();
        } catch (e) {
            console.error('Post-login sync failed', e);
            // Non-blocking error
        }
    };

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

                await performPostLoginSync();
                navigate('/');
            } else {
                const { error, data } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;

                if (data.session) {
                    await performPostLoginSync();
                    navigate('/');
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

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            if (Capacitor.isNativePlatform()) {
                await GoogleAuth.initialize();
                const googleUser = await GoogleAuth.signIn();
                const { error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: googleUser.authentication.idToken,
                });
                if (error) throw error;

                await performPostLoginSync();
                navigate('/');
            } else {
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: window.location.origin,
                    }
                });
                if (error) throw error;
                // Redirect happens automatically
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred during Google login');
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
                        {loading ? 'Processing & Syncing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-secondary/30"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-neutral dark:bg-secondary px-2 text-text-neutral/60">Or continue with</span>
                    </div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full bg-white dark:bg-white/5 border border-secondary/30 hover:bg-gray-50 dark:hover:bg-white/10 text-text-neutral dark:text-text-primary font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <svg className="w-5 h-5 font-bold" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                </button>

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
                            // Offline/Guest access strictly means "Don't login"
                            navigate('/');
                        }}
                        className="text-text-neutral hover:text-primary transition-colors underline decoration-dotted"
                    >
                        Continue as Guest (Offline)
                    </button>
                </div>
            </div>
        </div>
    );
};
