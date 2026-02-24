import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Activity, Loader2, RefreshCw, MessageSquare, CheckCircle, Megaphone, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { complaintService, type Complaint } from '../services/complaintService';
import { grievanceService, type Grievance } from '../services/grievanceService';
import { DEMO_COMPLAINTS } from '../services/demoData';
import toast from 'react-hot-toast';

// Unified display type — merges both tables
interface DisplayComplaint {
    id: string;
    source: 'complaint' | 'grievance';
    title: string;
    description: string;
    department: string;
    status: string;
    date: string;
    escalated?: boolean;
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { color: string; Icon: React.ElementType }> = {
        'Pending': { color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', Icon: Clock },
        'Submitted': { color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', Icon: Activity },
        'Under Review': { color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', Icon: Activity },
        'Resolved': { color: 'text-green-400 bg-green-500/10 border-green-500/30', Icon: CheckCircle },
        'Escalated': { color: 'text-red-400 bg-red-500/10 border-red-500/30', Icon: Megaphone },
    };
    const { color, Icon } = map[status] || map['Pending'];
    return (
        <span className={`status-badge border ${color}`}>
            <Icon size={10} />
            {status}
        </span>
    );
}

function ComplaintCard({ item, onEscalate }: { item: DisplayComplaint; onEscalate: (id: string, source: 'complaint' | 'grievance') => void }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className="glass-card p-5 hover:bg-white/8 transition-all duration-300">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle size={18} className="text-orange-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-white">{item.title}</h3>
                            <span className="text-[10px] font-mono bg-white/5 text-white/30 px-2 py-0.5 rounded-full">
                                {item.source === 'grievance' ? '🤖 via Chat' : '📝 Direct'}
                            </span>
                        </div>
                        <div className="text-xs text-white/40 mt-1 flex items-center gap-3 flex-wrap">
                            <span>🏛️ {item.department}</span>
                            <span>🗓️ {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        {item.description && (
                            <div className="mt-2">
                                <p className={`text-xs text-white/50 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
                                    {item.description}
                                </p>
                                {item.description.length > 100 && (
                                    <button
                                        onClick={() => setExpanded(!expanded)}
                                        className="text-[11px] text-electric-400 hover:text-electric-300 mt-1 flex items-center gap-0.5 transition-colors"
                                    >
                                        {expanded ? <><ChevronUp size={12} />Show less</> : <><ChevronDown size={12} />Read more</>}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={item.status} />
                    {(item.status === 'Pending' || item.status === 'Submitted') && (
                        <button
                            onClick={() => onEscalate(item.id, item.source)}
                            className="text-xs px-3 py-1.5 rounded-xl bg-gold-500/10 hover:bg-gold-500/20
                border border-gold-500/20 hover:border-gold-500/40 text-gold-400 transition-all font-medium"
                        >
                            🏛️ Escalate
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ComplaintPage() {
    const { user, isDemoMode } = useAuth();
    const [items, setItems] = useState<DisplayComplaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'complaint' | 'grievance'>('all');

    const normalize = (c: Complaint): DisplayComplaint => ({
        id: c.id || '',
        source: 'complaint',
        title: c.complaint,
        description: c.details || '',
        department: c.location || 'General',
        status: c.status,
        date: c.created_at || new Date().toISOString(),
    });

    const normalizeGrievance = (g: Grievance): DisplayComplaint => ({
        id: g.id || '',
        source: 'grievance',
        title: g.complaint.length > 60 ? g.complaint.slice(0, 60) + '…' : g.complaint,
        description: g.complaint,
        department: g.department,
        status: g.status,
        date: g.created_at || new Date().toISOString(),
        escalated: g.escalated,
    });

    const loadAll = async () => {
        if (isDemoMode) {
            setItems(DEMO_COMPLAINTS.map(normalize));
            setLoading(false);
            return;
        }
        if (!user) return;
        setLoading(true);
        const [complaints, grievances] = await Promise.all([
            complaintService.getComplaints(user.id).catch(() => [] as Complaint[]),
            grievanceService.getByUser(user.id).catch(() => [] as Grievance[]),
        ]);
        const merged: DisplayComplaint[] = [
            ...grievances.map(normalizeGrievance),
            ...complaints.map(normalize),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setItems(merged);
        setLoading(false);
    };

    useEffect(() => { loadAll(); }, [user, isDemoMode]);

    const handleEscalate = async (id: string, source: 'complaint' | 'grievance') => {
        try {
            if (source === 'grievance') {
                await grievanceService.escalate(id);
            } else {
                await complaintService.escalate(id);
            }
            toast.success('Complaint escalated to senior officer!', { icon: '🏛️' });
            loadAll();
        } catch {
            toast.error('Escalation failed. Please try again.');
        }
    };

    const counts = {
        all: items.length,
        complaint: items.filter(i => i.source === 'complaint').length,
        grievance: items.filter(i => i.source === 'grievance').length,
    };

    const filtered = filter === 'all' ? items : items.filter(i => i.source === filter);

    const pending = items.filter(i => i.status === 'Pending' || i.status === 'Submitted').length;
    const escalated = items.filter(i => i.status === 'Escalated').length;
    const resolved = items.filter(i => i.status === 'Resolved').length;

    return (
        <div className="p-6 space-y-6 overflow-y-auto h-full">
            {/* Header */}
            <div className="flex items-center justify-between animate-fade-in flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold text-white mb-1">Complaints & Grievances</h1>
                    <p className="text-white/40 text-sm">All complaints filed directly and via the AI Chat Assistant</p>
                </div>
                <button onClick={loadAll} className="btn-secondary flex items-center gap-2 text-sm">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Filed', value: items.length, color: 'text-white', bg: 'bg-white/5' },
                    { label: 'Pending', value: pending, color: 'text-yellow-400', bg: 'bg-yellow-500/5' },
                    { label: 'Escalated', value: escalated, color: 'text-red-400', bg: 'bg-red-500/5' },
                    { label: 'Resolved', value: resolved, color: 'text-green-400', bg: 'bg-green-500/5' },
                ].map(s => (
                    <div key={s.label} className={`glass-card p-4 ${s.bg}`}>
                        <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Info banner */}
            <div className="glass-card border-l-4 border-l-electric-500 p-4 flex items-start gap-3">
                <MessageSquare size={20} className="text-electric-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-white/80">File complaints via Chat Assistant</p>
                    <p className="text-xs text-white/40 mt-0.5">
                        Say <span className="text-electric-300 font-medium">"I want to file a complaint"</span> in the Chat — the AI collects all details and registers it here automatically. Supports voice in Hindi, English & Marathi.
                    </p>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-2">
                {(['all', 'grievance', 'complaint'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${filter === f
                            ? 'bg-electric-600/20 text-electric-400 border border-electric-500/30'
                            : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                    >
                        {f === 'all' ? `All (${counts.all})` : f === 'grievance' ? `Via Chat (${counts.grievance})` : `Direct (${counts.complaint})`}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={36} className="animate-spin text-electric-400" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass-card p-16 text-center animate-fade-in">
                    <AlertTriangle size={56} className="text-white/10 mx-auto mb-4" />
                    <p className="text-white/50 text-lg font-semibold">No complaints yet</p>
                    <p className="text-white/30 text-sm mt-2">
                        Say <strong>"I want to file a complaint"</strong> in the Chat Assistant to get started
                    </p>
                </div>
            ) : (
                <div className="space-y-3 animate-slide-up">
                    {filtered.map(item => (
                        <ComplaintCard key={`${item.source}-${item.id}`} item={item} onEscalate={handleEscalate} />
                    ))}
                </div>
            )}
        </div>
    );
}
