import { NavLink } from 'react-router-dom';
import {
    MessageSquare, LayoutDashboard, FileText, AlertTriangle,
    BookOpen, User, Shield, ChevronRight, Brain
} from 'lucide-react';

const navItems = [
    { label: 'Chat Assistant', icon: MessageSquare, path: '/chat' },
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'My Applications', icon: FileText, path: '/applications' },
    { label: 'Complaints', icon: AlertTriangle, path: '/complaint' },
    { label: 'Scheme Explorer', icon: BookOpen, path: '/schemes' },
    { label: 'Smart Insights', icon: Brain, path: '/insights' },
    { label: 'Profile', icon: User, path: '/profile' },
];


export default function Sidebar({ collapsed }: { collapsed?: boolean }) {
    return (
        <aside
            className={`${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 flex flex-col
        bg-navy-800/90 backdrop-blur-xl border-r border-white/5 h-full relative z-20`}
        >
            {/* Logo */}
            <div className="p-4 border-b border-white/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-600 to-electric-400 flex items-center justify-center shadow-lg shadow-electric-500/30 flex-shrink-0">
                    <Shield size={20} className="text-white" />
                </div>
                {!collapsed && (
                    <div className="min-w-0">
                        <div className="text-sm font-bold text-white leading-tight">Senate Bot</div>
                        <div className="text-xs text-gold-500 font-semibold leading-tight">Administrator</div>
                    </div>
                )}
            </div>

            {/* Tagline */}
            {!collapsed && (
                <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-[10px] text-white/30 leading-tight">
                        Autonomous Digital Governance<br />for Every Citizen
                    </p>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map(({ label, icon: Icon, path }) => (
                    <NavLink key={path} to={path}
                        className={({ isActive }) =>
                            isActive
                                ? `flex items-center gap-3 px-3 py-2.5 rounded-xl text-white
                   bg-gradient-to-r from-electric-600/25 to-transparent border border-electric-500/30
                   font-semibold transition-all duration-200 group`
                                : `flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50
                   hover:text-white hover:bg-white/5 transition-all duration-200 group`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <Icon size={18} className={isActive ? 'text-electric-400' : 'group-hover:text-electric-400 transition-colors'} />
                                {!collapsed && (
                                    <>
                                        <span className="flex-1 text-sm">{label}</span>
                                        {isActive && <ChevronRight size={14} className="text-electric-400 opacity-70" />}
                                    </>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            {!collapsed && (
                <div className="p-4 border-t border-white/5">
                    <div className="glass-card p-3 text-center">
                        <div className="text-[10px] text-white/30 leading-relaxed">
                            Powered by<br />
                            <span className="text-electric-400 font-semibold">Gemini AI</span> &{' '}
                            <span className="text-green-400 font-semibold">Supabase</span>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
