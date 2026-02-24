import { useState } from 'react';
import { User, Mail, Globe, Shield, LogOut, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇬🇧', desc: 'Default language' },
    { code: 'hi', label: 'हिंदी (Hindi)', flag: '🇮🇳', desc: 'Bot responds in Hindi' },
    { code: 'mr', label: 'मराठी (Marathi)', flag: '🌸', desc: 'Bot responds in Marathi' },
];

export default function ProfilePage() {
    const { user, language, setLanguage, logout } = useAuth();
    const [loggingOut, setLoggingOut] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await logout();
            toast.success('Logged out successfully');
            navigate('/login');
        } catch {
            toast.error('Logout failed');
            setLoggingOut(false);
        }
    };

    return (
        <div className="p-6 space-y-6 overflow-y-auto h-full max-w-2xl">
            <div className="animate-fade-in">
                <h1 className="text-2xl font-extrabold text-white mb-1">Profile</h1>
                <p className="text-white/40 text-sm">Manage your account and preferences</p>
            </div>

            {/* Avatar & basic info */}
            <div className="glass-card p-6 animate-slide-up">
                <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-electric-600 to-gold-500 flex items-center justify-center shadow-2xl shadow-electric-500/30 flex-shrink-0">
                        <User size={36} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-extrabold text-white">{user?.email?.split('@')[0] || 'Citizen'}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <Mail size={13} className="text-white/30" />
                            <span className="text-white/50 text-sm">{user?.email}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="status-badge border text-green-400 bg-green-500/10 border-green-500/30">
                                <CheckCircle size={10} /> Verified Citizen
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account details */}
            <div className="glass-card p-6 animate-slide-up">
                <div className="flex items-center gap-2 mb-4">
                    <Shield size={16} className="text-electric-400" />
                    <h3 className="font-bold text-white">Account Details</h3>
                </div>
                <div className="space-y-3">
                    {[
                        { label: 'User ID', value: user?.id?.slice(0, 20) + '...', mono: true },
                        { label: 'Authentication', value: 'Email OTP' },
                        { label: 'Member Since', value: new Date(user?.created_at || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) },
                        { label: 'Last Sign In', value: new Date(user?.last_sign_in_at || Date.now()).toLocaleDateString('en-IN') },
                    ].map(({ label, value, mono }) => (
                        <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                            <span className="text-sm text-white/40">{label}</span>
                            <span className={`text-sm text-white/70 ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Language preference */}
            <div className="glass-card p-6 animate-slide-up">
                <div className="flex items-center gap-2 mb-4">
                    <Globe size={16} className="text-electric-400" />
                    <h3 className="font-bold text-white">Language Preference</h3>
                </div>
                <div className="space-y-2">
                    {LANGUAGES.map(lang => (
                        <button
                            key={lang.code}
                            onClick={async () => {
                                await setLanguage(lang.code);
                                toast.success(`Language switched to ${lang.label}`, { icon: lang.flag });
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left
                ${language === lang.code
                                    ? 'bg-electric-600/20 border-electric-500/40 text-white'
                                    : 'bg-white/3 border-white/5 text-white/60 hover:bg-white/6 hover:border-white/10'
                                }`}
                        >
                            <span className="text-xl">{lang.flag}</span>
                            <div className="flex-1">
                                <div className="text-sm font-semibold">{lang.label}</div>
                                <div className="text-xs text-white/30">{lang.desc}</div>
                            </div>
                            {language === lang.code && <CheckCircle size={16} className="text-electric-400" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Logout */}
            <div className="glass-card p-6 animate-slide-up">
                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
            bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40
            text-red-400 font-semibold transition-all"
                >
                    {loggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
                    Sign Out
                </button>
            </div>
        </div>
    );
}
