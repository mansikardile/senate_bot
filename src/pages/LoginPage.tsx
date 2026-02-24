import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Shield, Loader2, CheckCircle, Zap, Eye, EyeOff, UserPlus } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [demoLoading, setDemoLoading] = useState(false);
    const navigate = useNavigate();
    const { enterDemoMode } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) { toast.error('Please fill in all fields'); return; }
        if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        setLoading(true);
        try {
            if (isSignUp) {
                await authService.signUp(email.trim(), password);
                toast.success('Account created! You are now logged in.', { icon: '🎉', duration: 4000 });
            } else {
                await authService.signIn(email.trim(), password);
                toast.success('Welcome back!', { icon: '👋' });
            }
            navigate('/chat');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Authentication failed.';
            if (msg.includes('Invalid login') || msg.includes('invalid_credentials')) {
                toast.error('Incorrect email or password. Try Demo Login below!');
            } else if (msg.includes('already registered') || msg.includes('already been registered')) {
                toast.error('Email already registered — sign in instead.', { duration: 4000 });
                setIsSignUp(false);
            } else {
                toast.error(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = () => {
        setDemoLoading(true);
        enterDemoMode();
        toast.success('Demo session started! Welcome to Senate Bot.', { icon: '🚀', duration: 3000 });
        navigate('/chat');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
            style={{ background: '#060D1F' }}>
            {/* Animated background orbs */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{
                    position: 'absolute', top: '-10rem', right: '-10rem',
                    width: '24rem', height: '24rem',
                    background: 'rgba(37,99,235,0.10)', borderRadius: '9999px', filter: 'blur(3rem)'
                }} className="animate-pulse-slow" />
                <div style={{
                    position: 'absolute', bottom: '-10rem', left: '-10rem',
                    width: '24rem', height: '24rem',
                    background: 'rgba(245,158,11,0.06)', borderRadius: '9999px', filter: 'blur(3rem)'
                }} className="animate-pulse-slow" />
            </div>

            {/* India tricolor strip */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', display: 'flex' }}>
                <div style={{ flex: 1, background: '#f97316' }} />
                <div style={{ flex: 1, background: '#ffffff' }} />
                <div style={{ flex: 1, background: '#16a34a' }} />
            </div>

            {/* Header */}
            <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div className="glow-electric" style={{
                        width: '4rem', height: '4rem', borderRadius: '1rem',
                        background: 'linear-gradient(135deg, #2563EB, #60A5FA)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 16px 48px rgba(59,130,246,0.40)'
                    }}>
                        <Shield size={32} color="white" />
                    </div>
                </div>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: 0 }}>
                    <span style={{ color: 'white' }}>Senate Bot </span>
                    <span className="text-gradient">Administrator</span>
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: '0.875rem', margin: '0.5rem 0 0' }}>
                    Autonomous Digital Governance for Every Citizen
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                        <div style={{ width: 4, height: 20, background: '#f97316', borderRadius: '4px 0 0 4px' }} />
                        <div style={{ width: 4, height: 20, background: 'white' }} />
                        <div style={{ width: 4, height: 20, background: '#16a34a', borderRadius: '0 4px 4px 0' }} />
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.30)', fontSize: '0.75rem', margin: 0 }}>
                        Government of India | Digital India Initiative
                    </p>
                </div>
            </div>

            {/* Login card */}
            <div className="animate-slide-up" style={{ width: '100%', maxWidth: '28rem', padding: '0 1rem', position: 'relative', zIndex: 10 }}>
                <div className="glass-card" style={{ padding: '2rem', boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}>

                    {/* Tab toggle */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.04)', borderRadius: '0.75rem', padding: '0.25rem' }}>
                        {(['Sign In', 'Sign Up'] as const).map((tab, i) => (
                            <button key={tab} onClick={() => setIsSignUp(i === 1)}
                                style={{
                                    flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                                    fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s',
                                    background: isSignUp === (i === 1) ? 'rgba(59,130,246,0.20)' : 'transparent',
                                    color: isSignUp === (i === 1) ? '#60A5FA' : 'rgba(255,255,255,0.40)',
                                    borderBottom: isSignUp === (i === 1) ? '2px solid #3B82F6' : '2px solid transparent',
                                }}>
                                {tab}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                        {/* Email */}
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} color="rgba(255,255,255,0.30)"
                                style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Email address"
                                className="input-field"
                                style={{ paddingLeft: '2.75rem' }}
                                autoComplete="email"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} color="rgba(255,255,255,0.30)"
                                style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                            <input
                                type={showPass ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Password (min 6 characters)"
                                className="input-field"
                                style={{ paddingLeft: '2.75rem', paddingRight: '3rem' }}
                                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                                required
                                minLength={6}
                            />
                            <button type="button" onClick={() => setShowPass(!showPass)}
                                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.30)', padding: 0 }}>
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
                            {loading
                                ? <><Loader2 size={18} className="animate-spin" /> {isSignUp ? 'Creating account...' : 'Signing in...'}</>
                                : isSignUp
                                    ? <><UserPlus size={18} /> Create Account</>
                                    : <><span>Sign In</span><ArrowRight size={18} /></>}
                        </button>
                    </form>

                    {/* Divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem' }}>OR</span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                    </div>

                    {/* Demo Login */}
                    <button
                        onClick={handleDemoLogin}
                        disabled={demoLoading}
                        style={{
                            width: '100%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            padding: '0.75rem 1.5rem', borderRadius: '0.75rem', cursor: 'pointer',
                            background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.08))',
                            border: '1px solid rgba(245,158,11,0.35)',
                            color: '#F59E0B', fontWeight: 600, fontSize: '0.9rem',
                            transition: 'all 0.3s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.15))')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.08))')}
                    >
                        {demoLoading
                            ? <><Loader2 size={16} className="animate-spin" /> Starting Demo...</>
                            : <><Zap size={16} /> Demo Login — No Password Needed</>}
                    </button>
                    <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: '0.7rem', textAlign: 'center', margin: '0.5rem 0 0' }}>
                        Instant access with pre-loaded sample data
                    </p>

                    {/* Security badges */}
                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {[
                                'No OTP required — email & password login',
                                'End-to-end encrypted session',
                                'Powered by Supabase & Gemini AI',
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.40)' }}>
                                    <CheckCircle size={12} color="#4ade80" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Services preview */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1rem' }}>
                    {[
                        { label: 'Certificates', icon: '📋' },
                        { label: 'Complaints', icon: '🗣️' },
                        { label: 'Schemes', icon: '📑' },
                    ].map(({ label, icon }) => (
                        <div key={label} className="glass-card animate-slide-up" style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{icon}</div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.50)' }}>{label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
