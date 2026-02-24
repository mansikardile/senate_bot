import { useState, useEffect } from 'react';
import {
    FileText, AlertTriangle, BookOpen, TrendingUp,
    Clock, CheckCircle, XCircle, Loader2, Users, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { applicationService, type Application } from '../services/applicationService';
import { complaintService, type Complaint } from '../services/complaintService';
import { schemeService, type SchemeRecord } from '../services/schemeService';
import { DEMO_APPLICATIONS, DEMO_COMPLAINTS, DEMO_SCHEMES } from '../services/demoData';

function StatCard({ icon: Icon, label, value, color, sublabel }: {
    icon: React.ElementType; label: string; value: number | string;
    color: string; sublabel?: string;
}) {
    return (
        <div className="glass-card p-5 hover:bg-white/8 transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon size={20} className="text-white" />
                </div>
                <div className={`text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/40 font-medium`}>
                    All time
                </div>
            </div>
            <div className="text-3xl font-extrabold text-white mb-1">{value}</div>
            <div className="text-sm font-semibold text-white/70">{label}</div>
            {sublabel && <div className="text-xs text-white/30 mt-0.5">{sublabel}</div>}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { color: string; icon: React.ElementType }> = {
        'Pending': { color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', icon: Clock },
        'Approved': { color: 'text-green-400 bg-green-500/10 border-green-500/30', icon: CheckCircle },
        'Rejected': { color: 'text-red-400 bg-red-500/10 border-red-500/30', icon: XCircle },
        'Under Review': { color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', icon: Activity },
    };
    const { color, icon: StatusIcon } = config[status] || config['Pending'];
    return (
        <span className={`status-badge border ${color}`}>
            <StatusIcon size={10} />
            {status}
        </span>
    );
}

export default function DashboardPage() {
    const { user, isDemoMode } = useAuth();
    const [applications, setApplications] = useState<Application[]>([]);
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [schemes, setSchemes] = useState<SchemeRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isDemoMode) {
            // Show sample data immediately — no Supabase needed
            setApplications(DEMO_APPLICATIONS);
            setComplaints(DEMO_COMPLAINTS);
            setSchemes(DEMO_SCHEMES);
            setLoading(false);
            return;
        }
        if (!user) return;
        Promise.all([
            applicationService.getApplications(user.id).catch(() => [] as Application[]),
            complaintService.getComplaints(user.id).catch(() => [] as Complaint[]),
            schemeService.getSchemes(user.id).catch(() => [] as SchemeRecord[]),
        ]).then(([apps, comps, schs]) => {
            setApplications(apps);
            setComplaints(comps);
            setSchemes(schs);
            setLoading(false);
        });
    }, [user, isDemoMode]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-electric-400 mx-auto mb-4" />
                    <p className="text-white/50">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const approved = applications.filter(a => a.status === 'Approved').length;
    const pending = applications.filter(a => a.status === 'Pending').length;
    const escalated = applications.filter(a => a.status === 'Escalated' || a.status === 'Under Review').length;

    return (
        <div className="p-6 space-y-6 overflow-y-auto h-full">
            <div className="animate-fade-in">
                <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-extrabold text-white">Dashboard</h1>
                    {isDemoMode && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-400 font-semibold">
                            🎬 Demo Mode
                        </span>
                    )}
                </div>
                <p className="text-white/40 text-sm">
                    Welcome back, <span className="text-electric-400 font-semibold">{isDemoMode ? 'Demo User' : (user?.email?.split('@')[0] || 'Citizen')}</span>
                    {' '}— here's your governance activity overview.
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
                <StatCard icon={FileText} label="Applications" value={applications.length}
                    color="bg-gradient-to-br from-electric-600 to-electric-400" sublabel={`${pending} pending`} />
                <StatCard icon={CheckCircle} label="Approved" value={approved}
                    color="bg-gradient-to-br from-green-600 to-green-400" sublabel="Ready to collect" />
                <StatCard icon={AlertTriangle} label="Complaints" value={complaints.length}
                    color="bg-gradient-to-br from-orange-600 to-orange-400" sublabel="Gov services" />
                <StatCard icon={BookOpen} label="Scheme PDFs" value={schemes.length}
                    color="bg-gradient-to-br from-gold-600 to-gold-400" sublabel="Downloaded" />
            </div>

            {/* Recent Applications */}
            <div className="glass-card p-5 animate-slide-up">
                <div className="flex items-center gap-2 mb-4">
                    <FileText size={18} className="text-electric-400" />
                    <h2 className="font-bold text-white">Recent Applications</h2>
                    <span className="text-xs text-white/30 font-medium ml-auto">{applications.length} total</span>
                </div>
                {applications.length === 0 ? (
                    <div className="text-center py-8">
                        <FileText size={40} className="text-white/10 mx-auto mb-3" />
                        <p className="text-white/30 text-sm">No applications yet</p>
                        <p className="text-white/20 text-xs mt-1">Chat with the bot to apply for certificates</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {applications.slice(0, 5).map(app => (
                            <div key={app.id} className="flex items-center justify-between p-3 bg-white/3 rounded-xl border border-white/5 hover:bg-white/6 transition-all">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-white">{app.type}</span>
                                        <span className="text-xs text-white/30 font-mono">{app.app_id}</span>
                                    </div>
                                    <div className="text-xs text-white/30 mt-0.5">
                                        {new Date(app.created_at || '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                </div>
                                <StatusBadge status={app.status} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Complaints & Schemes side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Complaints */}
                <div className="glass-card p-5 animate-slide-up">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle size={18} className="text-orange-400" />
                        <h2 className="font-bold text-white">Complaints</h2>
                    </div>
                    {complaints.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-white/30 text-sm">No complaints filed</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {complaints.slice(0, 4).map(c => (
                                <div key={c.id} className="p-3 bg-white/3 rounded-xl border border-white/5">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-white/80 truncate">{c.complaint}</div>
                                            <div className="text-xs text-white/30 mt-0.5">📍 {c.location}</div>
                                        </div>
                                        <StatusBadge status={c.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Scheme PDFs */}
                <div className="glass-card p-5 animate-slide-up">
                    <div className="flex items-center gap-2 mb-4">
                        <BookOpen size={18} className="text-gold-400" />
                        <h2 className="font-bold text-white">Scheme PDFs</h2>
                    </div>
                    {schemes.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-white/30 text-sm">No scheme PDFs yet</p>
                            <p className="text-white/20 text-xs mt-1">Ask about PMAY, PM Kisan, etc.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {schemes.slice(0, 4).map(s => (
                                <a
                                    key={s.id}
                                    href={s.pdf_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-3 p-3 bg-white/3 rounded-xl border border-white/5 hover:bg-white/6 transition-all group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gold-500/15 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
                                        <TrendingUp size={14} className="text-gold-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium text-white/80 truncate group-hover:text-white transition-colors">{s.scheme_name}</div>
                                        <div className="text-xs text-white/30">{new Date(s.created_at || '').toLocaleDateString('en-IN')}</div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* User info */}
            <div className="glass-card p-5 animate-slide-up">
                <div className="flex items-center gap-2 mb-3">
                    <Users size={18} className="text-electric-400" />
                    <h2 className="font-bold text-white">Account Details</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-white/40">Email:</span> <span className="text-white/80 ml-2">{isDemoMode ? 'demo@senatebot.gov.in' : user?.email}</span></div>
                    <div><span className="text-white/40">User ID:</span> <span className="text-white/40 ml-2 font-mono text-xs">{isDemoMode ? 'DEMO-MODE' : user?.id?.slice(0, 12) + '...'}</span></div>
                    <div><span className="text-white/40">Member since:</span> <span className="text-white/80 ml-2">{isDemoMode ? '23 Feb 2026' : new Date(user?.created_at || '').toLocaleDateString('en-IN')}</span></div>
                    <div><span className="text-white/40">Auth:</span> <span className="text-gold-400 ml-2">{isDemoMode ? '⚡ Demo Mode' : '✓ Email OTP'}</span></div>
                    <div><span className="text-white/40">Escalated:</span> <span className="text-red-400 ml-2">{escalated} case{escalated !== 1 ? 's' : ''}</span></div>
                </div>
            </div>
        </div>
    );
}
