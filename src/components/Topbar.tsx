import { useState } from 'react';
import { LogOut, Globe, ChevronDown, Bell, IndianRupee, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
    { code: 'mr', label: 'मराठी', flag: '🌸' },
];

export default function Topbar() {
    const { user, language, setLanguage, logout, theme, toggleTheme } = useAuth();
    const [langOpen, setLangOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);

    const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

    return (
        <header className="h-16 bg-navy-800/80 backdrop-blur-xl border-b border-white/5 flex items-center px-6 gap-4 relative z-30">
            {/* Gov branding */}
            <div className="flex items-center gap-2 mr-auto">
                <div className="flex gap-0.5">
                    <div className="w-1.5 h-6 bg-orange-500 rounded-l-full" />
                    <div className="w-1.5 h-6 bg-white" />
                    <div className="w-1.5 h-6 bg-green-500 rounded-r-full" />
                </div>
                <div>
                    <div className="text-xs font-bold text-white/80 leading-none">Digital India</div>
                    <div className="text-[10px] text-white/40 leading-none">Government of India</div>
                </div>
            </div>

            {/* Theme toggle */}
            <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all"
            >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notification bell */}
            <div className="relative">
                <button
                    onClick={() => { setNotifOpen(!notifOpen); setLangOpen(false); }}
                    className="relative p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all"
                >
                    <Bell size={18} />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-gold-500 rounded-full" />
                </button>
                {notifOpen && (
                    <div className="absolute right-0 top-12 w-72 glass-card-dark border border-white/10 shadow-2xl p-4 z-50">
                        <p className="text-xs font-semibold text-white/70 mb-3">Notifications</p>
                        <div className="space-y-2">
                            {[
                                { text: 'Your application SB-2026-0001 is under review', time: '2h ago' },
                                { text: 'New government scheme: PM Kisan Samman Nidhi update', time: '1d ago' },
                            ].map((n, i) => (
                                <div key={i} className="text-xs text-white/60 bg-white/5 rounded-lg p-2">
                                    <p>{n.text}</p>
                                    <p className="text-white/30 mt-1">{n.time}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Language switcher */}
            <div className="relative">
                <button
                    onClick={() => { setLangOpen(!langOpen); setNotifOpen(false); }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-sm"
                >
                    <Globe size={14} className="text-electric-400" />
                    <span className="text-white/80">{currentLang.flag} {currentLang.label}</span>
                    <ChevronDown size={12} className={`text-white/40 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
                </button>
                {langOpen && (
                    <div className="absolute right-0 top-12 glass-card-dark border border-white/10 shadow-2xl overflow-hidden z-50 min-w-[140px]">
                        {LANGUAGES.map(lang => (
                            <button
                                key={lang.code}
                                onClick={() => { setLanguage(lang.code); setLangOpen(false); }}
                                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-all
                  ${language === lang.code
                                        ? 'bg-electric-600/20 text-electric-400 font-semibold'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <span>{lang.flag}</span>
                                <span>{lang.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* User info */}
            <div className="flex items-center gap-3 pl-3 border-l border-white/10">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-electric-500 to-gold-500 flex items-center justify-center flex-shrink-0">
                    <IndianRupee size={14} className="text-white font-bold" />
                </div>
                <div className="hidden sm:block">
                    <div className="text-xs font-semibold text-white leading-none">
                        {user?.email?.split('@')[0] || 'Citizen'}
                    </div>
                    <div className="text-[10px] text-white/40 leading-none mt-0.5">{user?.email || ''}</div>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 text-xs font-medium transition-all ml-1"
                >
                    <LogOut size={13} />
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </div>
        </header>
    );
}
