import { createClient } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only log warning in development to avoid console noise in prod if unused
if (import.meta.env.DEV && (!supabaseUrl || !supabaseKey)) {
    console.warn('Supabase credentials missing! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

/**
 * Custom Storage Adapter for Capacitor
 * Ensures auth session persists on Android/iOS using Native Preferences
 */
const CapacitorStorage = {
    getItem: async (key: string): Promise<string | null> => {
        if (Capacitor.isNativePlatform()) {
            const { value } = await Preferences.get({ key });
            return value;
        }
        // Fallback to localStorage for Web
        return localStorage.getItem(key);
    },
    setItem: async (key: string, value: string): Promise<void> => {
        if (Capacitor.isNativePlatform()) {
            await Preferences.set({ key, value });
            return;
        }
        localStorage.setItem(key, value);
    },
    removeItem: async (key: string): Promise<void> => {
        if (Capacitor.isNativePlatform()) {
            await Preferences.remove({ key });
            return;
        }
        localStorage.removeItem(key);
    },
};

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder',
    {
        auth: {
            storage: CapacitorStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
    }
);
