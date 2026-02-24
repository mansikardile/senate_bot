import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, MicOff, Paperclip, RefreshCw, Download, Bot, User, Loader2, Zap, PlayCircle, AlertTriangle, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { geminiService } from '../services/geminiService';
import { applicationService } from '../services/applicationService';
import { complaintService } from '../services/complaintService';
import { schemeService } from '../services/schemeService';
import { birthCertService } from '../services/birthCertService';
import { grievanceService } from '../services/grievanceService';
import { useVoiceInput, useTTS, mapLanguageToVoice } from '../hooks/useVoiceInput';
import toast from 'react-hot-toast';

// ─── Types ──────────────────────────────────────────────────────────────────

type WorkflowState =
    | 'idle'
    // Income certificate
    | 'cert_type' | 'cert_name' | 'cert_aadhaar' | 'cert_address' | 'cert_income'
    // Birth certificate
    | 'birth_child_name' | 'birth_dob' | 'birth_place' | 'birth_father' | 'birth_mother' | 'birth_address'
    // Grievance
    | 'griev_dept' | 'griev_complaint'
    // Track
    | 'track_id';

interface Message {
    id: string;
    role: 'user' | 'bot';
    text: string;
    timestamp: Date;
    loading?: boolean;
    pdfUrl?: string | null;
    schemeName?: string | null;
    appId?: string | null;
    isAction?: boolean;
}

interface WorkflowData {
    certType?: string;
    name?: string;
    aadhaar?: string;
    address?: string;
    income?: string;
    // birth cert
    childName?: string;
    dob?: string;
    placeOfBirth?: string;
    fatherName?: string;
    motherName?: string;
    birthAddress?: string;
    // grievance
    department?: string;
    // escalation tracking
    lastAppId?: string;
    lastGrievId?: string;
}

// ─── Quick actions ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
    { label: '📋 Income Certificate', prompt: 'I want to apply for an income certificate' },
    { label: '👶 Birth Certificate', prompt: 'Apply birth certificate' },
    { label: '🗣️ File Grievance', prompt: 'I want to file a complaint' },
    { label: '🔍 Track Status', prompt: 'Check my status' },
    { label: '🏠 PMAY Scheme', prompt: 'Tell me about PMAY scheme' },
    { label: '🏥 Ayushman Bharat', prompt: 'Tell me about Ayushman Bharat scheme' },
];

// ─── Helper: generate short ID ─────────────────────────────────────────────
const shortId = () => 'SB-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

// ─── Typing indicator ──────────────────────────────────────────────────────

function TypingIndicator() {
    return (
        <div className="flex items-end gap-3 animate-slide-up">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-electric-600 to-electric-400 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Bot size={15} className="text-white" />
            </div>
            <div className="bot-bubble flex items-center gap-2 py-4 px-5">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
            </div>
        </div>
    );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, onDownload }: { msg: Message; onDownload?: (url: string, name: string) => void }) {
    if (msg.role === 'user') {
        return (
            <div className="flex items-end gap-3 justify-end animate-slide-up">
                <div>
                    <div className="user-bubble text-sm leading-relaxed">{msg.text}</div>
                    <div className="text-[10px] text-white/25 text-right mt-1">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <User size={15} className="text-white" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-end gap-3 animate-slide-up">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-electric-600 to-electric-400 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Bot size={15} className="text-white" />
            </div>
            <div className="max-w-[80%]">
                <div className="bot-bubble text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</div>

                {/* Application ID badge */}
                {msg.appId && (
                    <div className="mt-2 inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-green-400 font-bold text-sm">Application ID: {msg.appId}</span>
                    </div>
                )}

                {/* PDF download button */}
                {msg.pdfUrl && msg.schemeName && (
                    <button
                        onClick={() => onDownload?.(msg.pdfUrl!, msg.schemeName!)}
                        className="mt-2 flex items-center gap-2 bg-electric-600/15 hover:bg-electric-600/25 border border-electric-500/30
              rounded-xl px-4 py-2.5 text-sm text-electric-400 font-semibold transition-all hover:scale-[1.02] group"
                    >
                        <Download size={16} className="group-hover:animate-bounce" />
                        Download {msg.schemeName} PDF
                    </button>
                )}

                <div className="text-[10px] text-white/25 mt-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>
    );
}

// ─── Demo Mode Runner ──────────────────────────────────────────────────────────

async function runHackathonDemo(
    addBotMsg: (text: string, extras?: Partial<Message>) => void,
    delay: (ms: number) => Promise<void>,
    userId: string
) {
    addBotMsg('🎬 **Hackathon Demo Starting...**\n\nWatch me handle a complete government service workflow automatically! This demo shows:\n• Income Certificate Application\n• Instant Approval with Explanation\n• Status Tracking\n• Escalation Flow');

    await delay(2000);
    addBotMsg('📋 **Step 1/4 — Income Certificate**\n\nCitizen Rajesh Kumar wants to apply for an Income Certificate to avail subsidy benefits. Let me process that...');

    await delay(2000);
    let appId = shortId();
    try {
        const app = await applicationService.createApplication(userId, 'Income Certificate', {
            name: 'Rajesh Kumar',
            aadhaar: '987654321012',
            address: 'Plot 45, Sector 7, Nashik, Maharashtra 422001',
            income: '180000',
        });
        appId = app.app_id || appId;
    } catch { /* fallback to local ID */ }

    await delay(500);
    addBotMsg(
        `✅ **Application Submitted & Approved!**\n\n• Name: Rajesh Kumar\n• Annual Income: ₹1,80,000\n• Address: Plot 45, Sector 7, Nashik\n\n📌 **Explanation:** Your Income Certificate is approved because your annual income (₹1,80,000) is below the ₹2,50,000 threshold as per Government of India eligibility norms.`,
        { appId }
    );

    await delay(2500);
    addBotMsg(`🔍 **Step 2/4 — Status Check**\n\nChecking real-time status for Application ID: ${appId}...`);

    await delay(1500);
    addBotMsg(`✅ **Status Report**\n\n• Application ID: ${appId}\n• Type: Income Certificate\n• Status: Approved ✅\n• Submitted: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}\n\nCertificate is ready for collection at the concerned office.`);

    await delay(2000);
    addBotMsg(`⚠️ **Step 3/4 — Escalation Flow**\n\nCitizen Rajesh disagrees with the review process and requests to speak to an officer...`);

    await delay(1500);
    addBotMsg(`🚨 **Case Escalated to Government Officer**\n\n• Application ID: ${appId}\n• Status: Escalated\n• Assigned to: District Officer, Nashik Revenue Department\n\nA senior government officer will review your case within 48 hours and contact you directly. Reference your Application ID for follow-up.`);

    await delay(2000);
    addBotMsg(`👶 **Step 4/4 — Birth Certificate**\n\nProcessing Birth Certificate for a new citizen...`);

    await delay(1500);
    let birthId = 'BC-' + Date.now().toString().slice(-6);
    try {
        const bc = await birthCertService.create({
            user_id: userId,
            child_name: 'Ananya Sharma',
            dob: '2026-01-15',
            place_of_birth: 'Civil Hospital, Pune',
            father_name: 'Amit Sharma',
            mother_name: 'Priya Sharma',
            address: '12 MG Road, Pune, Maharashtra 411001',
            status: 'Approved',
        });
        birthId = bc.id?.slice(0, 8).toUpperCase() || birthId;
    } catch { /* fallback */ }

    addBotMsg(
        `✅ **Birth Certificate — Approved!**\n\n• Child: Ananya Sharma\n• Date of Birth: 15 January 2026\n• Place: Civil Hospital, Pune\n• Father: Amit Sharma | Mother: Priya Sharma\n\n📌 Birth Certificate issued successfully. All records saved to government database.`,
        { appId: birthId }
    );

    await delay(1500);
    addBotMsg(`🎉 **Demo Complete!**\n\nThis demo showcased:\n✅ Income Certificate with instant Approval\n✅ AI-powered eligibility explanation\n✅ Real-time status tracking\n✅ Escalation to government officer\n✅ Birth Certificate in one flow\n\n**Senate Bot Administrator** — Autonomous Digital Governance for every citizen of India. 🇮🇳\n\nPowered by Gemini AI + Supabase`);
}

// ─── Main ChatPage ─────────────────────────────────────────────────────────────

export default function ChatPage() {
    const { user, language } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '0',
            role: 'bot',
            text: `🙏 Namaste! I'm **Senate Bot Administrator**, your AI-powered government services assistant.\n\nI can help you:\n• 📋 Apply for Income Certificate\n• 👶 Apply for Birth Certificate\n• 🗣️ File Grievances with government departments\n• 🔍 Track all your application & grievance statuses\n• 📑 Get PDF reports on government schemes\n\nHow may I assist you today?`,
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [workflow, setWorkflow] = useState<WorkflowState>('idle');
    const [workflowData, setWorkflowData] = useState<WorkflowData>({});
    const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>>([]);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isDemoRunning, setIsDemoRunning] = useState(false);
    const [ttsEnabled, setTtsEnabled] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Voice helpers
    const voiceLang = mapLanguageToVoice(language);
    const { isListening, interimText, start: startVoice, stop: stopVoice, isSupported: voiceSupported } = useVoiceInput({
        lang: voiceLang,
        onTranscript: (text) => {
            setInput(text);
            // Auto-send after a brief pause
            setTimeout(() => {
                handleSend(text);
                setInput('');
            }, 300);
        },
        onError: (err) => toast.error(err, { icon: '🎤' }),
    });
    const { speak } = useTTS({ lang: voiceLang, enabled: ttsEnabled });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const addBotMessage = useCallback((text: string, extras: Partial<Message> = {}) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString() + Math.random(),
            role: 'bot',
            text,
            timestamp: new Date(),
            ...extras,
        }]);
        // Speak bot response if TTS enabled
        speak(text);
    }, [speak]);

    // For workflow step messages — translates to selected language first
    const translateAndBot = useCallback(async (text: string, extras: Partial<Message> = {}) => {
        if (language === 'en') {
            addBotMessage(text, extras);
            return;
        }
        try {
            const translated = await geminiService.translateMessage(text, language);
            addBotMessage(translated, extras);
        } catch {
            addBotMessage(text, extras); // fallback to English
        }
    }, [language, addBotMessage]);


    const addUserMessage = (text: string) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'user',
            text,
            timestamp: new Date(),
        }]);
    };

    const handleDownloadPdf = (url: string, name: string) => {
        if (url.startsWith('blob:')) {
            const a = document.createElement('a');
            a.href = url;
            a.download = `${name.replace(/\s+/g, '_')}_scheme.pdf`;
            a.click();
        } else {
            window.open(url, '_blank');
        }
        toast.success('Downloading PDF...', { icon: '📄' });
    };

    // ─── Demo Mode ─────────────────────────────────────────────────────────
    const handleRunDemo = async () => {
        if (!user || isDemoRunning) return;
        setIsDemoRunning(true);
        setWorkflow('idle');
        setWorkflowData({});
        const delay = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms));
        try {
            await runHackathonDemo(addBotMessage, delay, user.id);
        } finally {
            setIsDemoRunning(false);
        }
    };

    // ─── Workflow step handler ──────────────────────────────────────────────
    const handleWorkflowStep = useCallback(async (userMsg: string): Promise<boolean> => {
        if (workflow === 'idle') return false;

        // ── Income Certificate ──────────────────────────────────────────
        if (workflow === 'cert_type') {
            setWorkflowData(prev => ({ ...prev, certType: userMsg }));
            setWorkflow('cert_name');
            translateAndBot(`Sure, I will assist you with your **${userMsg}** application.\n\nStep 1 of 4 — Please provide your **full name** as per government records.`);
            return true;
        }
        if (workflow === 'cert_name') {
            setWorkflowData(prev => ({ ...prev, name: userMsg }));
            setWorkflow('cert_aadhaar');
            translateAndBot(`Thank you, ${userMsg}.\n\nStep 2 of 4 — Please provide your **12-digit Aadhaar Card number**.`);
            return true;
        }
        if (workflow === 'cert_aadhaar') {
            if (!/^\d{12}$/.test(userMsg.replace(/\s/g, ''))) {
                translateAndBot(`⚠️ I'm sorry, that doesn't appear to be a valid Aadhaar number. Please enter all 12 digits without spaces or dashes.`);
                return true;
            }
            setWorkflowData(prev => ({ ...prev, aadhaar: userMsg }));
            setWorkflow('cert_address');
            translateAndBot(`Step 3 of 4 — Please provide your **complete residential address** including district and PIN code.`);
            return true;
        }
        if (workflow === 'cert_address') {
            setWorkflowData(prev => ({ ...prev, address: userMsg }));
            setWorkflow('cert_income');
            translateAndBot(`Step 4 of 4 — Please provide your **total annual household income** (in INR).`);
            return true;
        }
        if (workflow === 'cert_income') {
            const finalData = { ...workflowData, income: userMsg };
            setWorkflow('idle');
            setWorkflowData({});
            if (!user) { addBotMessage('Please log in to submit applications.'); return true; }

            const incomeNum = parseInt(userMsg.replace(/[^0-9]/g, ''), 10) || 0;
            const isApproved = incomeNum < 250000;
            const certType = finalData.certType || 'Income Certificate';

            try {
                setIsTyping(true);
                const app = await applicationService.createApplication(user.id, certType, {
                    name: finalData.name || '',
                    aadhaar: finalData.aadhaar || '',
                    address: finalData.address || '',
                    income: userMsg,
                });
                setIsTyping(false);

                const explanation = isApproved
                    ? `📌 **Approval Reason:** Your ${certType} is approved because your declared annual income (₹${incomeNum.toLocaleString('en-IN')}) is below the ₹2,50,000 threshold set by the Government of India.`
                    : `📌 **Rejection Reason:** Your declared income (₹${incomeNum.toLocaleString('en-IN')}) exceeds the ₹2,50,000 eligibility limit for this certificate. You may appeal this decision by typing **"I disagree"**.`;

                translateAndBot(
                    `✅ **Application Submitted!**\n\nDetails registered:\n• Name: ${finalData.name}\n• Aadhaar: ****${finalData.aadhaar?.slice(-4)}\n• Address: ${finalData.address}\n• Annual Income: ₹${userMsg}\n• Status: **${isApproved ? 'Approved ✅' : 'Rejected ❌'}**\n\n${explanation}`,
                    { appId: app.app_id }
                );
                setWorkflowData({ lastAppId: app.app_id });
                toast.success('Application submitted!', { icon: '✅' });
            } catch {
                setIsTyping(false);
                addBotMessage(`⚠️ There was a technical issue saving your application. Please try again.`);
            }
            return true;
        }

        // ── Birth Certificate ──────────────────────────────────────────────
        if (workflow === 'birth_child_name') {
            setWorkflowData(prev => ({ ...prev, childName: userMsg }));
            setWorkflow('birth_dob');
            translateAndBot(`Thank you. Step 2 of 6 — Please provide the **Date of Birth** (DD/MM/YYYY or YYYY-MM-DD).`);
            return true;
        }
        if (workflow === 'birth_dob') {
            setWorkflowData(prev => ({ ...prev, dob: userMsg }));
            setWorkflow('birth_place');
            translateAndBot(`Step 3 of 6 — Please provide the **Place of Birth** (hospital name and city).`);
            return true;
        }
        if (workflow === 'birth_place') {
            setWorkflowData(prev => ({ ...prev, placeOfBirth: userMsg }));
            setWorkflow('birth_father');
            translateAndBot(`Step 4 of 6 — Please provide the **Father's full name**.`);
            return true;
        }
        if (workflow === 'birth_father') {
            setWorkflowData(prev => ({ ...prev, fatherName: userMsg }));
            setWorkflow('birth_mother');
            translateAndBot(`Step 5 of 6 — Please provide the **Mother's full name**.`);
            return true;
        }
        if (workflow === 'birth_mother') {
            setWorkflowData(prev => ({ ...prev, motherName: userMsg }));
            setWorkflow('birth_address');
            translateAndBot(`Step 6 of 6 — Please provide the **family's current residential address**.`);
            return true;
        }
        if (workflow === 'birth_address') {
            const finalData = { ...workflowData, birthAddress: userMsg };
            setWorkflow('idle');
            setWorkflowData({});
            if (!user) { addBotMessage('Please log in to submit applications.'); return true; }

            try {
                setIsTyping(true);
                const bc = await birthCertService.create({
                    user_id: user.id,
                    child_name: finalData.childName || '',
                    dob: finalData.dob || '',
                    place_of_birth: finalData.placeOfBirth || '',
                    father_name: finalData.fatherName || '',
                    mother_name: finalData.motherName || '',
                    address: userMsg,
                    status: 'Approved',
                });
                setIsTyping(false);
                const bcId = bc.id?.slice(0, 8).toUpperCase() || shortId();
                addBotMessage(
                    `✅ **Birth Certificate Application — Approved!**\n\nYour Birth Certificate application has been successfully submitted and approved.\n\n• Child Name: ${finalData.childName}\n• Date of Birth: ${finalData.dob}\n• Place of Birth: ${finalData.placeOfBirth}\n• Father: ${finalData.fatherName}\n• Mother: ${finalData.motherName}\n• Address: ${userMsg}\n\nThe Birth Certificate has been registered in the government database.`,
                    { appId: bcId }
                );
                toast.success('Birth Certificate approved!', { icon: '👶' });
            } catch {
                setIsTyping(false);
                addBotMessage(`⚠️ Could not save the application. Please try again.`);
            }
            return true;
        }

        // ── Grievance ──────────────────────────────────────────────────────
        if (workflow === 'griev_dept') {
            setWorkflowData(prev => ({ ...prev, department: userMsg }));
            setWorkflow('griev_complaint');
            translateAndBot(`I understand. Step 2 of 2 — Please describe your **grievance in detail** — what happened, when it occurred, and what resolution you seek.`);
            return true;
        }
        if (workflow === 'griev_complaint') {
            const finalData = { ...workflowData };
            setWorkflow('idle');
            setWorkflowData({});
            if (!user) { addBotMessage('Please log in to file grievances.'); return true; }

            try {
                setIsTyping(true);
                const gv = await grievanceService.file({
                    user_id: user.id,
                    department: finalData.department || 'General',
                    complaint: userMsg,
                    status: 'Submitted',
                });
                setIsTyping(false);
                const gvId = gv.id?.slice(0, 8).toUpperCase() || shortId();
                addBotMessage(
                    `✅ **Grievance Registered Successfully!**\n\nYour grievance has been filed with the concerned department.\n\n• Department: ${finalData.department}\n• Complaint: ${userMsg.slice(0, 100)}${userMsg.length > 100 ? '...' : ''}\n• Status: **Submitted**\n\nYour complaint will be reviewed within 5–7 working days. You may escalate by typing **"Talk to officer"** if needed.`,
                    { appId: gvId }
                );
                setWorkflowData({ lastGrievId: gv.id });
                toast.success('Grievance filed!', { icon: '📋' });
            } catch {
                setIsTyping(false);
                addBotMessage(`⚠️ Failed to file grievance. Please try again.`);
            }
            return true;
        }

        // ── Track ID workflow ──────────────────────────────────────────────
        if (workflow === 'track_id') {
            setWorkflow('idle');
            if (!user) { addBotMessage('Please log in to track applications.'); return true; }

            try {
                setIsTyping(true);
                // Fetch all statuses
                const [apps, births, gvs] = await Promise.all([
                    applicationService.getApplications(user.id).catch(() => []),
                    birthCertService.getByUser(user.id),
                    grievanceService.getByUser(user.id),
                ]);
                setIsTyping(false);

                if (!apps.length && !births.length && !gvs.length) {
                    addBotMessage(`📂 No applications found for your account yet.\n\nYou can apply for:\n• Income Certificate\n• Birth Certificate\n• File a Grievance\n\nType any of the above to get started!`);
                    return true;
                }

                let statusText = '📊 **Your Application Status Summary**\n\n';
                apps.forEach((a: { app_id?: string; type?: string; status?: string }) => {
                    const emoji = a.status === 'Approved' ? '✅' : a.status === 'Escalated' ? '🚨' : a.status === 'Rejected' ? '❌' : '⏳';
                    statusText += `${emoji} **${a.type || 'Certificate'}** — ${a.status}\n   ID: ${a.app_id || 'N/A'}\n\n`;
                });
                births.forEach((b: { id?: string; child_name?: string; status?: string }) => {
                    statusText += `✅ **Birth Certificate** (${b.child_name}) — ${b.status}\n   ID: ${b.id?.slice(0, 8).toUpperCase() || 'N/A'}\n\n`;
                });
                gvs.forEach((g: { id?: string; department?: string; status?: string }) => {
                    const emoji = g.status === 'Escalated' ? '🚨' : '📋';
                    statusText += `${emoji} **Grievance** (${g.department}) — ${g.status}\n   ID: ${g.id?.slice(0, 8).toUpperCase() || 'N/A'}\n\n`;
                });

                addBotMessage(statusText.trim());
            } catch {
                setIsTyping(false);
                addBotMessage(`⚠️ Unable to retrieve status. Please try again.`);
            }
            return true;
        }

        return false;
    }, [workflow, workflowData, user, addBotMessage]);

    // ─── Main send handler ────────────────────────────────────────────────────
    const handleSend = async (messageText?: string) => {
        const text = (messageText || input).trim();
        if (!text || isTyping || isGeneratingPdf || isDemoRunning) return;
        setInput('');
        addUserMessage(text);

        const newHistory = [...chatHistory, { role: 'user' as const, parts: [{ text }] }];

        // Check escalation keywords first (before workflow)
        const lowerText = text.toLowerCase();
        if (
            workflow === 'idle' &&
            (lowerText.includes('disagree') || lowerText.includes('talk to officer') ||
                lowerText.includes('escalate') || lowerText.includes('speak to officer'))
        ) {
            // Escalate last known app/grievance
            setIsTyping(true);
            try {
                const lastId = workflowData.lastAppId;
                if (lastId) await applicationService.updateStatus(lastId, 'Escalated').catch(() => { });
                const lastGvId = workflowData.lastGrievId;
                if (lastGvId) await grievanceService.escalate(lastGvId).catch(() => { });
            } catch { /* silent */ }
            setTimeout(() => {
                setIsTyping(false);
                addBotMessage(`🚨 **Case Escalated to Government Officer**\n\nYour case has been escalated to a senior government officer for review.\n\n• Assigned Department: District Revenue Office\n• Expected Response: Within 48 hours\n• You will be contacted directly by the officer\n\nYou may also visit your nearest government office with your Application ID for in-person follow-up.`);
            }, 1200);
            setChatHistory(newHistory);
            return;
        }

        // Handle workflow steps
        const handled = await handleWorkflowStep(text);
        if (handled) {
            setChatHistory(newHistory);
            return;
        }

        // Intent detection via Gemini
        setIsTyping(true);
        try {
            const response = await geminiService.sendMessage(chatHistory, text, language);
            const botText = response.response;

            const updatedHistory = [...newHistory, { role: 'model' as const, parts: [{ text: botText }] }];
            setChatHistory(updatedHistory);

            switch (response.intent) {
                case 'apply_certificate':
                    if (lowerText.includes('birth')) {
                        setWorkflow('birth_child_name');
                        setIsTyping(false);
                        translateAndBot(`Sure, I will assist you with the **Birth Certificate** application.\n\nStep 1 of 6 — Please provide the **child's full name**.`);
                    } else {
                        setWorkflow('cert_type');
                        setIsTyping(false);
                        translateAndBot(`${botText}\n\nStep 1 — Which certificate do you need?\n\n• Income Certificate\n• Birth Certificate\n• Caste Certificate\n• Residence Certificate\n\nPlease type the certificate name.`);
                    }
                    return;

                case 'file_complaint':
                    setWorkflow('griev_dept');
                    setIsTyping(false);
                    translateAndBot(`I understand you'd like to file a grievance. I'm here to help.\n\nStep 1 of 2 — Please tell me which **government department** your grievance is against:\n\n• Water Supply Department\n• Road & Infrastructure\n• Electricity Board\n• Municipal Corporation\n• Ration / PDS Office\n• Revenue Department\n• Other (please specify)`);
                    return;

                case 'track_status':
                    setWorkflow('track_id');
                    setIsTyping(false);
                    addBotMessage(`${botText}\n\nI will fetch all your applications and grievances. Please type **"show my status"** or press Enter to continue.`);
                    // Auto-trigger track (skip the ID step)
                    setTimeout(() => handleWorkflowStep('fetch'), 500);
                    return;

                case 'scheme_info':
                    setIsTyping(false);
                    if (response.scheme_name || text) {
                        const schemeName = response.scheme_name || text;
                        setIsGeneratingPdf(true);
                        addBotMessage(`${botText}\n\n⏳ Generating detailed PDF report for **${schemeName}**...`);
                        try {
                            const citizenEmail = user?.email || 'citizen@example.com';
                            const citizenName = citizenEmail.split('@')[0] || 'Citizen';
                            const { pdfUrl } = await schemeService.generateAndStoreSchemePdf(
                                user?.id || 'anonymous',
                                schemeName,
                                citizenName,
                                citizenEmail,
                                language
                            );
                            addBotMessage(
                                `✅ **${schemeName}** PDF report generated!\n\nIncludes: Overview · Benefits · Eligibility · Documents · Application steps · Official links\n\nClick below to download:`,
                                { pdfUrl, schemeName }
                            );
                            toast.success('PDF Generated!', { icon: '📄' });
                        } catch {
                            addBotMessage(`⚠️ Could not generate PDF. Please check your Gemini API key.`);
                        }
                        setIsGeneratingPdf(false);
                    } else {
                        addBotMessage(botText);
                    }
                    return;

                default:
                    setIsTyping(false);
                    addBotMessage(botText);
            }
        } catch (err: unknown) {
            setIsTyping(false);
            const msg = err instanceof Error ? err.message : 'Unknown error';
            addBotMessage(`⚠️ Connection issue: ${msg}\n\nPlease check your Gemini API key in the .env file and try again.`);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const clearChat = () => {
        setMessages([{
            id: '0',
            role: 'bot',
            text: `🙏 Namaste! I'm Senate Bot Administrator. How may I assist you today?`,
            timestamp: new Date(),
        }]);
        setChatHistory([]);
        setWorkflow('idle');
        setWorkflowData({});
        setInput('');
    };

    return (
        <div className="flex flex-col h-full">
            {/* Chat header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-navy-800/50 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-electric-600 to-electric-400 flex items-center justify-center shadow-lg shadow-electric-500/30">
                        <Bot size={18} className="text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-white">Senate Bot Administrator</h2>
                            <div className="flex items-center gap-1 bg-green-500/15 border border-green-500/30 rounded-full px-2 py-0.5">
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                <span className="text-[10px] text-green-400 font-semibold">Online</span>
                            </div>
                        </div>
                        <p className="text-[11px] text-white/40">
                            Gemini AI · Voice: {voiceLang.split('-')[0].toUpperCase()} · {isListening ? '🔴 Listening...' : voiceSupported ? '🎤 Ready' : '⚠️ No mic'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isGeneratingPdf && (
                        <div className="flex items-center gap-1.5 text-xs text-gold-400 bg-gold-500/10 border border-gold-500/20 rounded-lg px-3 py-1.5">
                            <Loader2 size={12} className="animate-spin" />
                            Generating PDF...
                        </div>
                    )}
                    {/* TTS toggle */}
                    <button
                        onClick={() => setTtsEnabled(!ttsEnabled)}
                        title={ttsEnabled ? 'Bot voice ON — click to mute' : 'Enable bot voice'}
                        className={`p-2 rounded-xl transition-all relative ${ttsEnabled
                            ? 'text-electric-400 bg-electric-500/20 border border-electric-500/40 shadow-lg shadow-electric-500/20'
                            : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                            }`}
                    >
                        {ttsEnabled && (
                            <span className="absolute inset-0 rounded-xl border border-electric-400/40 animate-ping" />
                        )}
                        {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </button>
                    {/* Hackathon Demo Button */}
                    <button
                        onClick={handleRunDemo}
                        disabled={isDemoRunning}
                        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl
              bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/30 hover:border-gold-500/50
              text-gold-400 font-semibold transition-all disabled:opacity-50"
                    >
                        {isDemoRunning
                            ? <><Loader2 size={12} className="animate-spin" /> Running Demo...</>
                            : <><PlayCircle size={13} /> Hackathon Demo</>
                        }
                    </button>
                    <button onClick={clearChat} className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5">
                        <RefreshCw size={13} /> Clear
                    </button>
                </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map(msg => (
                    <MessageBubble key={msg.id} msg={msg} onDownload={handleDownloadPdf} />
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick actions (shown only at start) */}
            {messages.length <= 1 && (
                <div className="px-6 pb-3 flex-shrink-0">
                    <p className="text-xs text-white/30 mb-2 font-medium">Quick Actions</p>
                    <div className="flex flex-wrap gap-2">
                        {QUICK_ACTIONS.map(({ label, prompt }) => (
                            <button
                                key={label}
                                onClick={() => handleSend(prompt)}
                                className="text-xs px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10
                  hover:border-electric-500/30 text-white/70 hover:text-white transition-all hover:scale-[1.02] flex items-center gap-1.5"
                            >
                                <Zap size={11} className="text-gold-400 flex-shrink-0" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Workflow hint */}
            {workflow !== 'idle' && (
                <div className="px-6 pb-1 flex-shrink-0">
                    <div className="flex items-center gap-2 text-[11px] text-gold-400 bg-gold-500/5 border border-gold-500/20 rounded-lg px-3 py-1.5">
                        <AlertTriangle size={11} />
                        Workflow active — please answer the question above
                    </div>
                </div>
            )}

            {/* Input area */}
            <div className="px-6 pb-6 flex-shrink-0">
                <div className="glass-card-dark p-1 flex items-center gap-2">
                    <label htmlFor="doc-upload" className="p-2 rounded-lg text-white/30 hover:text-white/60 transition-colors flex-shrink-0 cursor-pointer">
                        <Paperclip size={18} />
                    </label>
                    <input
                        ref={inputRef}
                        type="text"
                        value={isListening ? interimText : input}
                        onChange={e => { if (!isListening) setInput(e.target.value); }}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            isListening
                                ? `🎤 Listening in ${language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English'}...`
                                : workflow !== 'idle'
                                    ? 'Type your response or tap 🎤 to speak...'
                                    : 'Type or tap 🎤 to speak in Hindi, English or Marathi...'
                        }
                        className={`flex-1 bg-transparent text-sm placeholder-white/30 outline-none py-3 px-2 ${isListening ? 'text-electric-300' : 'text-white'
                            }`}
                        disabled={isTyping || isGeneratingPdf || isDemoRunning || isListening}
                    />
                    {/* Voice button */}
                    <button
                        onClick={() => isListening ? stopVoice() : startVoice()}
                        disabled={!voiceSupported || isTyping || isDemoRunning}
                        title={!voiceSupported ? 'Not supported in this browser' : isListening ? 'Stop listening' : 'Speak your message'}
                        className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${isListening
                            ? 'text-white bg-red-500 animate-pulse shadow-lg shadow-red-500/30'
                            : voiceSupported
                                ? 'text-white/50 hover:text-white hover:bg-white/10'
                                : 'text-white/20 cursor-not-allowed'
                            }`}
                    >
                        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                    <button
                        onClick={() => handleSend()}
                        disabled={(!input.trim() && !isListening) || isTyping || isGeneratingPdf || isDemoRunning}
                        className="btn-primary flex-shrink-0 p-3 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </div>
                <div className="flex items-center justify-between mt-2 px-1">
                    <p className="text-[10px] text-white/20">Powered by Gemini AI · Voice: {voiceLang} · Secured by Supabase</p>
                    {isDemoRunning && (
                        <div className="flex items-center gap-1 text-[10px] text-gold-400">
                            <PlayCircle size={10} className="animate-pulse" />
                            Demo running...
                        </div>
                    )}
                </div>
            </div>

            {/* File upload */}
            <input type="file" id="doc-upload" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !user) return;
                toast.loading('Uploading document...');
                try {
                    await applicationService.uploadDocument(user.id, file, 'general');
                    toast.dismiss();
                    toast.success(`${file.name} uploaded!`, { icon: '📎' });
                    addUserMessage(`Uploaded document: ${file.name}`);
                    addBotMessage(`✅ Your document **${file.name}** has been securely uploaded and linked to your profile.`);
                } catch {
                    toast.dismiss();
                    toast.error('Upload failed. Please try again.');
                }
            }} />
        </div>
    );
}
