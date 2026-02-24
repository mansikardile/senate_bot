import { useState } from 'react';
import {
    Brain, TrendingUp, Bell, Search, CheckCircle, XCircle, AlertCircle,
    ChevronRight, Lightbulb, BarChart3, Shield, Activity
} from 'lucide-react';

// ─── Data ──────────────────────────────────────────────────────────────────────

const SCHEMES = [
    {
        id: 'pmay', name: 'Pradhan Mantri Awas Yojana (PMAY)', icon: '🏠',
        description: 'Housing for all — subsidized home loans for EWS/LIG/MIG families.',
        criteria: [
            { label: 'Annual Income', field: 'income', op: '<', value: 1800000, display: 'Below ₹18,00,000' },
            { label: 'No existing house', field: 'hasHouse', op: '==', value: false, display: 'No pucca house owned' },
        ],
        benefit: 'Home loan interest subsidy up to ₹2.67 lakh',
        dept: 'Ministry of Housing & Urban Affairs',
    },
    {
        id: 'pmkisan', name: 'PM Kisan Samman Nidhi', icon: '🌾',
        description: '₹6,000/year direct income support for small & marginal farmers.',
        criteria: [
            { label: 'Farmer', field: 'isFarmer', op: '==', value: true, display: 'Must be a farmer' },
            { label: 'Land holding', field: 'landAcres', op: '<', value: 5, display: 'Land below 5 acres' },
        ],
        benefit: '₹6,000/year in 3 installments of ₹2,000',
        dept: 'Ministry of Agriculture & Farmers Welfare',
    },
    {
        id: 'abypm', name: 'Ayushman Bharat PM-JAY', icon: '🏥',
        description: 'Health cover ₹5 lakh per family per year for secondary & tertiary care.',
        criteria: [
            { label: 'Annual Income', field: 'income', op: '<', value: 250000, display: 'Below ₹2,50,000' },
            { label: 'BPL / SECC listed', field: 'isBPL', op: '==', value: true, display: 'BPL or SECC 2011 listed' },
        ],
        benefit: '₹5 lakh/year health insurance — 1,500+ hospitals across India',
        dept: 'Ministry of Health & Family Welfare',
    },
    {
        id: 'nsp', name: 'National Scholarship Portal (NSP)', icon: '📚',
        description: 'Merit-cum-means scholarships for students from minority & SC/ST/OBC communities.',
        criteria: [
            { label: 'Student', field: 'isStudent', op: '==', value: true, display: 'Must be enrolled in school/college' },
            { label: 'Annual Income', field: 'income', op: '<', value: 200000, display: 'Family income below ₹2,00,000' },
        ],
        benefit: 'Up to ₹25,000/year scholarship',
        dept: 'Ministry of Minority Affairs / Education',
    },
    {
        id: 'pmsby', name: 'PM Suraksha Bima Yojana', icon: '🛡️',
        description: 'Accident insurance cover of ₹2 lakh for just ₹20/year premium.',
        criteria: [
            { label: 'Age', field: 'age', op: 'between', value: [18, 70], display: 'Age 18–70 years' },
            { label: 'Bank account', field: 'hasBank', op: '==', value: true, display: 'Active savings bank account' },
        ],
        benefit: '₹2 lakh accident cover at ₹20/year premium',
        dept: 'Ministry of Finance',
    },
];

const PROACTIVE_REMINDERS = [
    { icon: '⚠️', title: 'PM Kisan Installment Due', desc: 'Next installment of ₹2,000 expected in April 2026. Ensure your Aadhaar-bank linkage is active.', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', daysLeft: 38 },
    { icon: '📋', title: 'Income Certificate Expiring', desc: 'Income certificates older than 1 year may need renewal for scheme applications.', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', daysLeft: 15 },
    { icon: '🏥', title: 'Ayushman Card Available', desc: 'Download your Ayushman Bharat card from the PMJAY portal to access cashless treatment.', color: 'text-green-400 bg-green-500/10 border-green-500/20', daysLeft: null },
    { icon: '📚', title: 'NSP Scholarship Window Open', desc: 'National Scholarship Portal application window is open until 31 March 2026.', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', daysLeft: 35 },
];

const SCHEME_DEMAND = [
    { name: 'PMAY', demand: 87, trend: '+12%', color: '#3B82F6' },
    { name: 'PM Kisan', demand: 92, trend: '+8%', color: '#22C55E' },
    { name: 'Ayushman', demand: 78, trend: '+21%', color: '#F59E0B' },
    { name: 'NSP', demand: 65, trend: '+5%', color: '#A855F7' },
    { name: 'PMSBY', demand: 45, trend: '+3%', color: '#EC4899' },
];

// ─── Eligibility Checker ──────────────────────────────────────────────────────

interface CheckResult {
    scheme: typeof SCHEMES[0];
    eligible: boolean;
    reasons: string[];
}

function EligibilityChecker() {
    const [form, setForm] = useState({
        income: '', age: '', isFarmer: '', isStudent: '', hasHouse: '', isBPL: '', hasBank: '', landAcres: '',
    });
    const [results, setResults] = useState<CheckResult[] | null>(null);

    const check = () => {
        const inc = parseInt(form.income) || 0;
        const age = parseInt(form.age) || 0;

        const userProfile = {
            income: inc,
            age,
            isFarmer: form.isFarmer === 'yes',
            isStudent: form.isStudent === 'yes',
            hasHouse: form.hasHouse === 'yes',
            isBPL: form.isBPL === 'yes',
            hasBank: form.hasBank === 'yes',
            landAcres: parseFloat(form.landAcres) || 0,
        };

        const checked: CheckResult[] = SCHEMES.map(scheme => {
            const reasons: string[] = [];
            let eligible = true;

            for (const c of scheme.criteria) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const val = (userProfile as Record<string, any>)[c.field];
                if (c.op === '<') {
                    if (!(val < c.value)) { reasons.push(`${c.label}: ${c.display}`); eligible = false; }
                } else if (c.op === '==') {
                    if (val !== c.value) { reasons.push(`${c.label}: ${c.display}`); eligible = false; }
                } else if (c.op === 'between') {
                    const [lo, hi] = c.value as number[];
                    if (!(val >= lo && val <= hi)) { reasons.push(`${c.label}: ${c.display}`); eligible = false; }
                }
            }
            return { scheme, eligible, reasons };
        });

        setResults(checked);
    };

    return (
        <div className="space-y-6">
            <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Search size={18} className="text-electric-400" />
                    <h3 className="font-bold text-white">Check Your Eligibility</h3>
                    <span className="text-xs text-white/30 ml-auto">Fill what's relevant to you</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                        <label className="text-xs text-white/40 mb-1 block">Annual Family Income (₹)</label>
                        <input className="input-field text-sm py-2" placeholder="e.g. 150000"
                            value={form.income} onChange={e => setForm({ ...form, income: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-xs text-white/40 mb-1 block">Your Age</label>
                        <input className="input-field text-sm py-2" placeholder="e.g. 35"
                            value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-xs text-white/40 mb-1 block">Land Holding (acres)</label>
                        <input className="input-field text-sm py-2" placeholder="e.g. 2"
                            value={form.landAcres} onChange={e => setForm({ ...form, landAcres: e.target.value })} />
                    </div>
                    {[
                        { key: 'isFarmer', label: 'Are you a farmer?' },
                        { key: 'isStudent', label: 'Are you a student?' },
                        { key: 'hasHouse', label: 'Do you own a pucca house?' },
                        { key: 'isBPL', label: 'BPL / SECC listed?' },
                        { key: 'hasBank', label: 'Have a bank account?' },
                    ].map(({ key, label }) => (
                        <div key={key}>
                            <label className="text-xs text-white/40 mb-1 block">{label}</label>
                            <select
                                className="input-field text-sm py-2"
                                value={(form as Record<string, string>)[key]}
                                onChange={e => setForm({ ...form, [key]: e.target.value })}
                            >
                                <option value="">Select...</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
                        </div>
                    ))}
                </div>
                <button onClick={check} className="btn-primary mt-4 flex items-center gap-2 text-sm px-5 py-2.5">
                    <Search size={15} /> Check All Schemes
                </button>
            </div>

            {results && (
                <div className="space-y-3 animate-slide-up">
                    <p className="text-xs text-white/40 font-medium">
                        {results.filter(r => r.eligible).length} of {results.length} schemes match your profile
                    </p>
                    {results.map(r => (
                        <div key={r.scheme.id}
                            className={`glass-card p-4 border-l-4 ${r.eligible ? 'border-l-green-500' : 'border-l-red-500/50'}`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">{r.scheme.icon}</span>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-white text-sm">{r.scheme.name}</h4>
                                        </div>
                                        <p className="text-xs text-white/40 mt-0.5">{r.scheme.dept}</p>
                                        {r.eligible ? (
                                            <p className="text-xs text-green-400 mt-1.5 font-medium">🎁 {r.scheme.benefit}</p>
                                        ) : (
                                            <div className="mt-1.5 space-y-0.5">
                                                {r.reasons.map((reason, i) => (
                                                    <p key={i} className="text-xs text-red-400/70">✗ {reason}</p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-shrink-0">
                                    {r.eligible
                                        ? <CheckCircle size={20} className="text-green-400" />
                                        : <XCircle size={20} className="text-red-400/50" />
                                    }
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main InsightsPage ─────────────────────────────────────────────────────────

export default function InsightsPage() {
    const [tab, setTab] = useState<'eligibility' | 'reminders' | 'analytics'>('eligibility');

    return (
        <div className="p-6 space-y-6 overflow-y-auto h-full">
            {/* Header */}
            <div className="animate-fade-in">
                <div className="flex items-center gap-2 mb-1">
                    <Brain size={22} className="text-electric-400" />
                    <h1 className="text-2xl font-extrabold text-white">Smart Insights</h1>
                </div>
                <p className="text-white/40 text-sm">
                    AI-powered eligibility checker, proactive reminders, and scheme demand forecasts
                </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { icon: Search, label: 'Eligibility Check', desc: '5 schemes analyzed', color: 'from-electric-600 to-electric-400' },
                    { icon: Bell, label: 'Proactive Alerts', desc: '4 reminders active', color: 'from-gold-600 to-gold-400' },
                    { icon: BarChart3, label: 'Scheme Demand', desc: 'AI predictions', color: 'from-green-600 to-green-400' },
                    { icon: Shield, label: 'Transparency', desc: 'Open public data', color: 'from-purple-600 to-purple-400' },
                ].map(({ icon: Icon, label, desc, color }) => (
                    <div key={label} className="glass-card p-4 hover:bg-white/8 transition-all group">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                            <Icon size={17} className="text-white" />
                        </div>
                        <div className="text-sm font-semibold text-white">{label}</div>
                        <div className="text-xs text-white/40 mt-0.5">{desc}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/5 pb-0">
                {([
                    { key: 'eligibility', icon: Search, label: 'Eligibility Checker' },
                    { key: 'reminders', icon: Bell, label: 'Proactive Alerts' },
                    { key: 'analytics', icon: TrendingUp, label: 'Scheme Analytics' },
                ] as const).map(({ key, icon: Icon, label }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all border-b-2 -mb-px ${tab === key
                            ? 'text-electric-400 border-electric-400 bg-electric-500/5'
                            : 'text-white/40 border-transparent hover:text-white/60'
                            }`}
                    >
                        <Icon size={14} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {tab === 'eligibility' && <EligibilityChecker />}

            {tab === 'reminders' && (
                <div className="space-y-3 animate-slide-up">
                    <p className="text-xs text-white/40 font-medium">
                        Proactive reminders to keep your benefits active and applications on time
                    </p>
                    {PROACTIVE_REMINDERS.map((r, i) => (
                        <div key={i} className={`glass-card p-4 border ${r.color} flex items-start gap-4`}>
                            <span className="text-2xl flex-shrink-0">{r.icon}</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <h4 className="font-semibold text-white text-sm">{r.title}</h4>
                                    {r.daysLeft !== null && (
                                        <span className="text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded-full flex-shrink-0">
                                            {r.daysLeft} days left
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-white/50 mt-1 leading-relaxed">{r.desc}</p>
                            </div>
                            <ChevronRight size={16} className="text-white/20 flex-shrink-0 mt-0.5" />
                        </div>
                    ))}
                    <div className="glass-card p-4 border border-electric-500/20 bg-electric-500/5">
                        <div className="flex items-center gap-2 mb-2">
                            <Lightbulb size={16} className="text-gold-400" />
                            <span className="text-sm font-semibold text-white">AI Prediction</span>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed">
                            Based on your application history, you are likely eligible for <strong className="text-electric-300">3 more government schemes</strong> you haven't applied to yet.
                            Use the <strong className="text-gold-300">Eligibility Checker</strong> tab to find them.
                        </p>
                    </div>
                </div>
            )}

            {tab === 'analytics' && (
                <div className="space-y-4 animate-slide-up">
                    <p className="text-xs text-white/40 font-medium">
                        Publicly visible demand analytics — helping government plan better
                    </p>
                    {/* Demand bars */}
                    <div className="glass-card p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 size={16} className="text-electric-400" />
                            <h3 className="font-semibold text-white text-sm">Scheme Application Demand (This Month)</h3>
                        </div>
                        <div className="space-y-3">
                            {SCHEME_DEMAND.map(s => (
                                <div key={s.name}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-white/70 font-medium">{s.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-green-400 font-semibold">{s.trend}</span>
                                            <span className="text-xs text-white/40">{s.demand}%</span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${s.demand}%`, background: s.color }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Gov transparency */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { icon: '📊', title: 'Applications This Month', value: '1,24,832', sublabel: '+12% vs last month', color: 'text-electric-400' },
                            { icon: '✅', title: 'Approval Rate', value: '73%', sublabel: 'National average', color: 'text-green-400' },
                            { icon: '⏱️', title: 'Avg Processing Time', value: '3.2 days', sublabel: 'Down from 7 days', color: 'text-gold-400' },
                            { icon: '🏛️', title: 'Escalated Cases', value: '2,341', sublabel: 'Under review by officers', color: 'text-orange-400' },
                        ].map(c => (
                            <div key={c.title} className="glass-card p-4">
                                <div className="text-xl mb-2">{c.icon}</div>
                                <div className={`text-2xl font-extrabold ${c.color}`}>{c.value}</div>
                                <div className="text-xs font-semibold text-white/70 mt-0.5">{c.title}</div>
                                <div className="text-[11px] text-white/30 mt-0.5">{c.sublabel}</div>
                            </div>
                        ))}
                    </div>

                    <div className="glass-card p-4 border border-purple-500/20 bg-purple-500/5">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity size={16} className="text-purple-400" />
                            <span className="text-sm font-semibold text-white">Government Forecast</span>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed">
                            AI predicts <strong className="text-purple-300">35% higher demand</strong> for PMAY and Ayushman Bharat in Q2 2026 due to seasonal employment patterns. Government offices should prepare additional staff in February–April.
                        </p>
                        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-purple-400">
                            <AlertCircle size={11} />
                            Powered by Gemini AI prediction models
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
