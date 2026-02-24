import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

// ─── Demo user (used when Supabase anon auth not available) ──────────────────
const DEMO_USER: User = {
    id: 'demo-user-00000000',
    email: 'demo@senatebot.gov.in',
    app_metadata: {},
    user_metadata: { full_name: 'Demo Citizen' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
} as User;

// ─── Types ─────────────────────────────────────────────────────────────────────
interface AuthContextType {
    user: User | null;
    session: Session | null;
    language: string;
    setLanguage: (lang: string) => void;
    loading: boolean;
    isDemoMode: boolean;
    enterDemoMode: () => void;
    logout: () => Promise<void>;
    theme: 'dark' | 'light';
    toggleTheme: () => void;
}

// ─── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [language, setLangState] = useState<string>('en');
    const [loading, setLoading] = useState(true);
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        const saved = localStorage.getItem('app_theme');
        return (saved === 'light' ? 'light' : 'dark');
    });

    // Apply theme class to html element on mount + change
    useEffect(() => {
        document.documentElement.classList.toggle('light-theme', theme === 'light');
    }, [theme]);

    useEffect(() => {
        // Check for demo mode persisted in sessionStorage
        if (sessionStorage.getItem('demo_mode') === 'true') {
            setUser(DEMO_USER);
            setIsDemoMode(true);
            setLoading(false);
            return;
        }

        supabase.auth.getSession().then(({ data: { session: sess } }) => {
            setSession(sess);
            setUser(sess?.user ?? null);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
            if (isDemoMode) return; // don't override demo mode
            setSession(sess);
            setUser(sess?.user ?? null);
        });

        return () => subscription?.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const enterDemoMode = () => {
        sessionStorage.setItem('demo_mode', 'true');
        setUser(DEMO_USER);
        setIsDemoMode(true);
        setLoading(false);
    };

    const toggleTheme = () => {
        setTheme(prev => {
            const next = prev === 'dark' ? 'light' : 'dark';
            localStorage.setItem('app_theme', next);
            return next;
        });
    };

    const setLanguage = (lang: string) => {
        setLangState(lang);
    };

    const logout = async () => {
        if (isDemoMode) {
            sessionStorage.removeItem('demo_mode');
            setIsDemoMode(false);
            setUser(null);
            setSession(null);
            return;
        }
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
    };

    return (
        <AuthContext.Provider value={{ user, session, language, setLanguage, loading, isDemoMode, enterDemoMode, logout, theme, toggleTheme }}>
            {children}
        </AuthContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
