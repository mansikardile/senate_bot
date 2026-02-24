import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Loader2, Shield, RotateCcw } from 'lucide-react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

export default function OtpPage() {
    const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const navigate = useNavigate();
    const location = useLocation();
    const email = (location.state as { email: string })?.email || '';

    if (!email) {
        navigate('/login');
        return null;
    }

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newOtp = [...otp];
        pasted.split('').forEach((char, i) => { if (i < 6) newOtp[i] = char; });
        setOtp(newOtp);
        inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < 6) { toast.error('Please enter all 6 digits'); return; }
        setLoading(true);
        try {
            await authService.verifyOtp(email, code);
            toast.success('Verified successfully! Welcome!', { duration: 3000 });
            navigate('/chat');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Invalid OTP. Please try again.';
            toast.error(msg);
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            await authService.sendOtp(email);
            toast.success('OTP resent!');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } catch {
            toast.error('Failed to resend OTP');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-navy-900 flex items-center justify-center relative overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-electric-600/10 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gold-500/8 rounded-full blur-3xl animate-pulse-slow" />

            {/* India tricolor strip */}
            <div className="absolute top-0 left-0 right-0 h-1 flex">
                <div className="flex-1 bg-orange-500" />
                <div className="flex-1 bg-white" />
                <div className="flex-1 bg-green-600" />
            </div>

            <div className="w-full max-w-md px-4 relative z-10">
                <div className="glass-card p-8 animate-slide-up shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-electric-600 to-electric-400 flex items-center justify-center shadow-lg shadow-electric-500/30">
                            <Shield size={22} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Verify OTP</h1>
                            <p className="text-white/40 text-xs">Enter the 6-digit code sent to</p>
                        </div>
                    </div>

                    <div className="mb-6 p-3 bg-electric-600/10 border border-electric-500/20 rounded-xl">
                        <p className="text-electric-400 text-sm font-medium text-center">{email}</p>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-6">
                        <div className="flex justify-center gap-3" onPaste={handlePaste}>
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => { inputRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleChange(i, e.target.value)}
                                    onKeyDown={e => handleKeyDown(i, e)}
                                    className={`otp-input text-center ${digit ? 'border-electric-500 bg-electric-500/10' : ''}`}
                                />
                            ))}
                        </div>

                        <button type="submit" disabled={loading || otp.join('').length < 6} className="btn-primary w-full flex items-center justify-center gap-2">
                            {loading ? (
                                <><Loader2 size={18} className="animate-spin" /> Verifying...</>
                            ) : (
                                <><span>Verify & Continue</span><ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                        <button
                            onClick={() => navigate('/login')}
                            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={14} /> Back
                        </button>
                        <button
                            onClick={handleResend}
                            disabled={resending}
                            className="flex items-center gap-1.5 text-sm text-electric-400 hover:text-electric-300 transition-colors"
                        >
                            {resending ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                            Resend OTP
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
