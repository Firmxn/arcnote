import { create } from 'zustand';
import { supabase } from '../data/supabase';
import type { User, AuthError } from '@supabase/supabase-js';

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
        supabase.auth.onAuthStateChange((_event, session) => {
            set({ user: session?.user || null, isLoading: false });
        });
    },

    setUser: (user) => set({ user }),

    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null });
    },
}));
