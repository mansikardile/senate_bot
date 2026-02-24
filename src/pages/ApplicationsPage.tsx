import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, XCircle, Activity, Upload, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { applicationService, type Application } from '../services/applicationService';
import { DEMO_APPLICATIONS } from '../services/demoData';
import toast from 'react-hot-toast';

function StatusBadge({ status }: { status: string }) {
    const configs: Record<string, { color: string; icon: React.ElementType }> = {
        'Pending': { color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', icon: Clock },
        'Approved': { color: 'text-green-400 bg-green-500/10 border-green-500/30', icon: CheckCircle },
        'Rejected': { color: 'text-red-400 bg-red-500/10 border-red-500/30', icon: XCircle },
        'Under Review': { color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', icon: Activity },
    };
    const { color, icon: Icon } = configs[status] || configs['Pending'];
    return (
        <span className={`status-badge border ${color}`}>
            <Icon size={10} />{status}
        </span>
    );
}

export default function ApplicationsPage() {
    const { user, isDemoMode } = useAuth();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);

    const loadApplications = async () => {
        if (isDemoMode) {
            setApplications(DEMO_APPLICATIONS);
            setLoading(false);
            return;
        }
        if (!user) return;
        setLoading(true);
        const apps = await applicationService.getApplications(user.id).catch(() => []);
        setApplications(apps);
        setLoading(false);
    };

    useEffect(() => { loadApplications(); }, [user, isDemoMode]);

    const handleEscalate = async (app: Application) => {
        if (!app.app_id) return;
        await applicationService.updateStatus(app.app_id, 'Under Review');
        toast.success('Escalated to officer!', { icon: '🏛️' });
        loadApplications();
    };

    const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, appId: string) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        setUploading(appId);
        try {
            const url = await applicationService.uploadDocument(user.id, file, appId);
            await applicationService.linkDocumentToApplication(appId, url);
            toast.success(`${file.name} linked to application!`, { icon: '📎' });
            loadApplications();
        } catch {
            toast.error('Upload failed');
        }
        setUploading(null);
    };

    return (
        <div className="p-6 space-y-6 overflow-y-auto h-full">
            <div className="flex items-center justify-between animate-fade-in">
                <div>
                    <h1 className="text-2xl font-extrabold text-white mb-1">My Applications</h1>
                    <p className="text-white/40 text-sm">{applications.length} application{applications.length !== 1 ? 's' : ''} found</p>
                </div>
                <button onClick={loadApplications} className="btn-secondary flex items-center gap-2 text-sm">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={36} className="animate-spin text-electric-400" />
                </div>
            ) : applications.length === 0 ? (
                <div className="glass-card p-16 text-center animate-fade-in">
                    <FileText size={56} className="text-white/10 mx-auto mb-4" />
                    <p className="text-white/50 text-lg font-semibold">No applications yet</p>
                    <p className="text-white/30 text-sm mt-2">Chat with the bot to apply for government certificates</p>
                </div>
            ) : (
                <div className="space-y-4 animate-slide-up">
                    {applications.map(app => (
                        <div key={app.id} className="glass-card p-5 hover:bg-white/8 transition-all duration-300 group">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-electric-600/15 border border-electric-500/20 flex items-center justify-center flex-shrink-0">
                                        <FileText size={20} className="text-electric-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-bold text-white text-base">{app.type}</h3>
                                            <span className="text-xs font-mono text-white/30 bg-white/5 px-2 py-0.5 rounded-lg">{app.app_id}</span>
                                        </div>
                                        <div className="text-xs text-white/40 mt-1">
                                            Filed on {new Date(app.created_at || '').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </div>

                                        {/* Details */}
                                        {app.details && Object.keys(app.details).length > 0 && (
                                            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1">
                                                {Object.entries(app.details).map(([k, v]) => (
                                                    <div key={k} className="text-xs">
                                                        <span className="text-white/30 capitalize">{k}: </span>
                                                        <span className="text-white/60">{v}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Documents */}
                                        {app.document_urls && app.document_urls.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {app.document_urls.map((url, i) => (
                                                    <a key={i} href={url} target="_blank" rel="noreferrer"
                                                        className="text-xs text-electric-400 bg-electric-500/10 border border-electric-500/20 px-2 py-1 rounded-lg hover:border-electric-500/40 transition-colors">
                                                        📎 Document {i + 1}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <StatusBadge status={app.status} />

                                    {/* Upload doc */}
                                    <label className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer">
                                        {uploading === app.app_id ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                        Upload Doc
                                        <input type="file" className="hidden" onChange={e => handleDocUpload(e, app.app_id)}
                                            accept=".pdf,.jpg,.jpeg,.png" />
                                    </label>

                                    {/* Escalate */}
                                    {app.status === 'Pending' && (
                                        <button
                                            onClick={() => handleEscalate(app)}
                                            className="text-xs px-3 py-1.5 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/20 hover:border-gold-500/40 text-gold-400 transition-all font-medium"
                                        >
                                            🏛️ Escalate to Officer
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
