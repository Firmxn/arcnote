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
                        queryParams: {
                            prompt: 'select_account'
                        }
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
        <div className="min-h-screen w-full bg-white dark:bg-primary overflow-y-auto text-text-neutral dark:text-text-primary">
            <div className="min-h-screen py-12 flex flex-col items-center justify-center px-4">

                {/* Main Container 
                    Mobile: Transparent, Full Width, Tall Spacing
                    Desktop (md): Card Style, Compact Spacing, Wider but shorter
                */}
                <div className="w-full max-w-[420px] md:max-w-[480px] md:bg-neutral md:dark:bg-secondary md:shadow-2xl md:rounded-3xl md:p-8 md:border md:border-neutral-200 md:dark:border-white/5 transition-all duration-300">

                    {/* Logo & Headline - Made compact on Desktop */}
                    <div className="text-center mb-10 md:mb-6">
                        <div className="w-16 h-16 md:w-14 md:h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-4">
                            <svg className="w-8 h-8 md:w-8 md:h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl md:text-2xl font-bold mb-2 md:mb-1 tracking-tight text-text-neutral dark:text-white">
                            {mode === 'login' ? 'Sign In' : 'Sign Up'}
                        </h1>
                        <p className="text-text-neutral/60 dark:text-text-secondary text-sm md:text-xs">
                            {mode === 'login'
                                ? 'Please enter your email and password'
                                : 'Create an account to sync your data'}
                        </p>
                    </div>

                    {/* Messages */}
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

                    {/* Form Section */}
                    <form onSubmit={handleAuth} className="space-y-5 md:space-y-4">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-text-neutral/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                            </div>
                            <input
                                type="email"
                                className="w-full pl-12 pr-5 py-3.5 md:py-3 rounded-full border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 text-text-neutral dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all placeholder:text-text-neutral/40 text-sm md:text-base"
                                placeholder="Email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-text-neutral/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <input
                                type="password"
                                className="w-full pl-12 pr-5 py-3.5 md:py-3 rounded-full border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 text-text-neutral dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all placeholder:text-text-neutral/40 text-sm md:text-base"
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        {mode === 'login' && (
                            <div className="flex justify-end -mt-1">
                                <button type="button" className="text-xs text-text-neutral/60 hover:text-accent transition-colors font-medium">
                                    Forgot Password?
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-3.5 md:py-3 rounded-full shadow-lg shadow-accent/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-base md:text-sm"
                        >
                            {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Sign Up')}
                        </button>
                    </form>

                    <div className="relative my-8 md:my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-neutral-200 dark:border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white dark:bg-primary md:dark:bg-secondary px-4 text-text-neutral/40 font-medium">Or</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full bg-transparent border border-neutral-200 dark:border-white/20 hover:bg-neutral-50 dark:hover:bg-white/5 text-text-neutral dark:text-white font-medium py-3.5 md:py-3 rounded-full transition-all flex items-center justify-center gap-3 active:scale-[0.98] text-base md:text-sm"
                    >
                        <svg className="w-5 h-5 md:w-4 md:h-4" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                    </button>

                    {/* Footer Links */}
                    <div className="pt-8 md:pt-6 text-center space-y-6 md:space-y-4 pb-2 md:pb-0">
                        <div className="text-sm text-text-neutral/60 dark:text-text-secondary">
                            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
                            <button
                                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); setMessage(null); }}
                                className="text-accent font-bold hover:underline focus:outline-none"
                            >
                                {mode === 'login' ? 'Sign Up' : 'Sign In'}
                            </button>
                        </div>

                        <button
                            onClick={() => navigate('/')}
                            className="text-xs text-text-neutral/40 hover:text-text-neutral dark:text-text-secondary hover:underline focus:outline-none transition-colors mb-4 md:mb-0 block w-full"
                        >
                            Continue as Guest
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
