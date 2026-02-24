import { supabase } from './supabaseClient';

export interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    preferred_language?: string;
    created_at?: string;
}

export const authService = {
    async sendOtp(email: string) {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: true },
        });
        if (error) throw error;
        return true;
    },

    async verifyOtp(email: string, token: string) {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email',
        });
        if (error) throw error;
        if (data.user) {
            await authService.upsertUserProfile(data.user);
        }
        return data;
    },

    async getSession() {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },

    async getUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    async logout() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    async upsertUserProfile(user: { id: string; email?: string | null }) {
        const { error } = await supabase.from('users').upsert({
            id: user.id,
            email: user.email ?? '',
            preferred_language: 'en',
        }, { onConflict: 'id' });
        if (error) console.warn('Profile upsert error:', error.message);
    },

    async getUserProfile(userId: string): Promise<UserProfile | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) return null;
        return data;
    },

    async updateLanguage(userId: string, language: string) {
        const { error } = await supabase
            .from('users')
            .update({ preferred_language: language })
            .eq('id', userId);
        if (error) throw error;
    },

    onAuthStateChange(callback: (event: string, session: unknown) => void) {
        return supabase.auth.onAuthStateChange(callback);
    },

    async signInAnonymously() {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        if (data.user) {
            // Create a minimal profile for the anon user
            await authService.upsertUserProfile({
                id: data.user.id,
                email: `demo_${data.user.id.slice(0, 8)}@senatebot.demo`,
            });
        }
        return data;
    },
};
