import { create } from 'zustand';
import { supabase } from '../data/supabase';
import type { User, AuthError } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: AuthError | null;

    // Actions
    initialize: () => Promise<void>;
    setUser: (user: User | null) => void;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    error: null,

    initialize: async () => {
        set({ isLoading: true });

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        set({ user: session?.user || null, error: error, isLoading: false });

        // Listen for changes
        supabase.auth.onAuthStateChange(async (_event, session) => {
            const newUser = session?.user || null;

            // Clear data immediately jika user berbeda
            if (newUser) {
                const { clearUserData } = await import('../lib/sync');
                await clearUserData(newUser.id);
            }

            set({ user: newUser, isLoading: false });
        });
    },

    setUser: (user) => set({ user }),

    signOut: async () => {
        // Clear local data saat logout (best practice untuk privacy & security)
        const { clearAllData } = await import('../lib/sync');
        await clearAllData();

        await supabase.auth.signOut();

        // Sign out from Google Plugin if on native platform
        if (Capacitor.isNativePlatform()) {
            try {
                await GoogleAuth.signOut();
            } catch (e) {
                console.error('Failed to sign out from Google Auth Plugin', e);
            }
        }

        set({ user: null });
    },
}));
