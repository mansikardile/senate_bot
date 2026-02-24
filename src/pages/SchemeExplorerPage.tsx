import { useState, useEffect } from 'react';
import { BookOpen, Download, Loader2, RefreshCw, Search, Sparkles, X, Moon, Sun, Globe, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { schemeService, type SchemeRecord } from '../services/schemeService';
import { generateSchemePdf, type PdfTheme, type PdfLanguage, type SchemeDetails } from '../services/pdfService';
import { geminiService } from '../services/geminiService';
import toast from 'react-hot-toast';

// ─── Hardcoded rich fallback data (always works, even if Gemini is down) ─────
const SCHEME_DATA: Record<string, SchemeDetails> = {
    'PMAY': {
        name: 'Pradhan Mantri Awas Yojana (PMAY)',
        launch_year: '2015',
        ministry: 'Ministry of Housing & Urban Affairs',
        description: 'PMAY is a flagship mission of the Government of India that aims to provide affordable housing to urban and rural poor by 2022. It provides financial assistance to eligible beneficiaries for construction, enhancement, and purchase of houses, with credit-linked interest subsidies for home loans.',
        benefits: [
            'Interest subsidy of 3–6.5% on home loans for EWS/LIG/MIG categories',
            'Subsidy of up to ₹2.67 lakh on housing loan interest',
            'In-situ slum redevelopment with private sector participation',
            'Credit Linked Subsidy Scheme (CLSS) for middle income groups',
            'Financial assistance for new house construction in rural areas under PMAY-G',
        ],
        eligibility: [
            'Indian citizen with valid Aadhaar card',
            'Annual income below ₹18 lakh (MIG) / ₹6 lakh (LIG) / ₹3 lakh (EWS)',
            'Beneficiary family should not own a pucca house anywhere in India',
            'First-time homebuyers — no prior housing scheme benefit received',
            'At least one female member as co-owner (for EWS/LIG)',
        ],
        documents_required: [
            'Aadhaar Card (mandatory)',
            'Income Certificate / Salary Slips',
            'Bank Account details (account linked to Aadhaar)',
            'Passport-size photographs',
            'Property documents / land ownership proof',
        ],
        application_process: [
            'Visit pmaymis.gov.in or Common Service Centre (CSC)',
            'Click on "Citizen Assessment" and choose applicable category',
            'Enter 12-digit Aadhaar number for OTP verification',
            'Fill in personal, income, and bank account details',
            'Upload required documents and submit the application',
            'Note down Application Reference Number for tracking',
        ],
        official_link: 'https://pmaymis.gov.in',
        budget_allocation: '₹79,590 crore allocated under PMAY (U) — over 1.18 crore houses sanctioned',
    },
    'PM Kisan Samman Nidhi': {
        name: 'PM Kisan Samman Nidhi (PM-KISAN)',
        launch_year: '2019',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        description: 'PM-KISAN is a Central Sector Scheme that provides income support of ₹6,000 per year to all landholding farmer families in India. The amount is given directly to the bank accounts of the beneficiaries in three equal instalments of ₹2,000 every four months, without any intermediary.',
        benefits: [
            'Direct income support of ₹6,000 per year in 3 instalments of ₹2,000',
            'Money credited directly to bank account (DBT) — no middlemen',
            'Helps meet expenses related to agricultural inputs and domestic needs',
            'Covers all landholding farmer families across India',
        ],
        eligibility: [
            'All landholding farmer families (husband, wife, and minor children)',
            'Name must be in State/UT Land Records',
            'Must have a valid bank account linked to Aadhaar',
            'Excludes: Income Tax payers, constitutional post holders, government employees (except Group D)',
        ],
        documents_required: [
            'Aadhaar Card (mandatory for authentication)',
            'Land Ownership Records / Khasra / Khatauni',
            'Bank Account details (passbook)',
            'Mobile number registered with bank',
        ],
        application_process: [
            'Visit pmkisan.gov.in → "Farmers Corner" → "New Farmer Registration"',
            'Enter Aadhaar number and state, then click "Click here to continue"',
            'Fill farmer registration form with personal and bank details',
            'Update land records details and submit',
            'Registration is verified by village/tehsil officials',
            'Once approved, instalments are credited automatically',
        ],
        official_link: 'https://pmkisan.gov.in',
        budget_allocation: '₹60,000 crore/year — over 11 crore farmers benefiting',
    },
    'Ayushman Bharat': {
        name: 'Ayushman Bharat PM-JAY',
        launch_year: '2018',
        ministry: 'Ministry of Health & Family Welfare',
        description: 'Ayushman Bharat PM-JAY is the world\'s largest government-funded health insurance scheme. It provides a health cover of ₹5 lakh per family per year for secondary and tertiary care hospitalisation across India. The scheme covers more than 10.74 crore poor and vulnerable families.',
        benefits: [
            'Health cover of ₹5 lakh per family per year',
            'Coverage for 1,929 medical procedures including surgeries and day-care',
            'Cashless and paperless treatment at 25,000+ empanelled hospitals',
            'Pre and post hospitalisation expenses covered',
            'No restriction on family size, age, or gender',
            'All pre-existing conditions covered from day one',
        ],
        eligibility: [
            'Families listed in SECC 2011 database (Socio-Economic Caste Census)',
            'BPL (Below Poverty Line) card holders',
            'Construction workers, rickshaw pullers, domestic helpers, sanitation workers',
            'Unorganised workers registered under Pradhan Mantri Shram Yogi Maandhan',
        ],
        documents_required: [
            'Aadhaar Card or Ration Card for identity proof',
            'SECC 2011 registered mobile number for OTP verification',
            'Existing Ayushman Card (if previously registered)',
        ],
        application_process: [
            'Check eligibility at pmjay.gov.in or toll-free 14555',
            'Visit nearest Common Service Centre (CSC) or empanelled hospital',
            'Complete KYC with Aadhaar biometric verification',
            'Get Ayushman Card (Golden Card) issued',
            'Visit any empanelled hospital — show card for cashless treatment',
        ],
        official_link: 'https://pmjay.gov.in',
        budget_allocation: 'Over ₹5,390 crore claims settled — 5.5 crore hospitalisations covered',
    },
    'Swachh Bharat': {
        name: 'Swachh Bharat Mission (SBM)',
        launch_year: '2014',
        ministry: 'Ministry of Jal Shakti / Ministry of Housing & Urban Affairs',
        description: 'Swachh Bharat Mission is a nationwide cleanliness campaign to accelerate efforts to achieve universal sanitation coverage, improve hygiene, and eliminate open defecation across rural and urban India. It covers construction of household toilets, community sanitation complexes and solid waste management.',
        benefits: [
            'Financial incentive up to ₹12,000 for household toilet construction (rural)',
            'Free Individual Household Latrines (IHHL) for BPL families',
            'Solid waste management facilities at village and ward levels',
            'Community toilet complexes in urban areas',
            'ODF (Open Defecation Free) certification for eligible villages and wards',
        ],
        eligibility: [
            'BPL households without existing toilet (rural — SBM-G)',
            'SC/ST, small and marginal farmers, landless labourers, physically handicapped',
            'Urban residents in slums and low-income households (SBM-U)',
            'Applicant must not have received any previous sanitation incentive',
        ],
        documents_required: [
            'Aadhaar Card',
            'BPL Card / Income Certificate',
            'Bank Account details',
            'Land ownership / No Objection Certificate',
            'Photograph of applicant',
        ],
        application_process: [
            'Apply through Gram Panchayat (rural) or Urban Local Body (urban)',
            'Alternatively apply on swachhbharaturban.gov.in',
            'Fill application form with Aadhaar and bank details',
            'Verification by local authority / village-level worker',
            'Toilet construction support or incentive disbursement on completion',
        ],
        official_link: 'https://swachhbharat.mygov.in',
        budget_allocation: '₹62,009 crore sanctioned — over 10.9 crore toilets constructed',
    },
    'Beti Bachao Beti Padhao': {
        name: 'Beti Bachao Beti Padhao (BBBP)',
        launch_year: '2015',
        ministry: 'Ministry of Women & Child Development',
        description: 'Beti Bachao Beti Padhao scheme addresses the declining Child Sex Ratio (CSR) and promotes education and welfare of the girl child. It focusses on preventing sex-selective abortion, ensuring girls\' survival and protection, and promoting education and participation of girls in society.',
        benefits: [
            'Prevention of gender-biased sex selection through awareness campaigns',
            'Improved enrolment and retention of girls in schools',
            'Support for scholarships and vocational training for girls',
            'Sukanya Samriddhi Yojana account for long-term savings for girl child',
            'Free coaching and career counselling for girls',
        ],
        eligibility: [
            'All Indian families with girl children',
            'Sukanya Samriddhi Account: girl child below 10 years of age',
            'Special focus districts with low Child Sex Ratio',
            'Families from all economic backgrounds can participate',
        ],
        documents_required: [
            'Girl child\'s Birth Certificate',
            'Parents\' Aadhaar Cards',
            'Bank account details (for Sukanya Samriddhi Yojana)',
            'Proof of address',
        ],
        application_process: [
            'Visit nearest Post Office or authorised bank for Sukanya Samriddhi Account',
            'Collect and fill account opening form',
            'Submit documents: birth certificate, parent ID and address proof',
            'Initial deposit minimum ₹250 to open account',
            'Account matures after 21 years from date of opening',
        ],
        official_link: 'https://wcd.nic.in/bbbp-schemes',
        budget_allocation: '₹848 crore allocated — scheme active in 640 districts across India',
    },
    'Mudra Yojana': {
        name: 'Pradhan Mantri Mudra Yojana (PMMY)',
        launch_year: '2015',
        ministry: 'Ministry of Finance / MUDRA Ltd.',
        description: 'PM Mudra Yojana provides collateral-free micro-loans to non-corporate, non-farm small/micro enterprises through Micro Units Development and Refinance Agency (MUDRA). It offers three types of loans — Shishu (up to ₹50,000), Kishore (₹50,001–₹5 lakh), and Tarun (₹5–₹10 lakh).',
        benefits: [
            'Collateral-free loans up to ₹10 lakh for micro and small businesses',
            'Shishu Loans up to ₹50,000 for new/startup businesses',
            'Kishore Loans (₹50,001–₹5 lakh) for established businesses',
            'Tarun Loans (₹5 lakh–₹10 lakh) for growth and expansion',
            'No processing fee for Shishu category loans',
        ],
        eligibility: [
            'Indian citizens aged 18–65 years',
            'Non-corporate, non-farm micro/small business owners',
            'Traders, vendors, artisans, shopkeepers, food service operators',
            'No minimum income requirement — focus on small entrepreneurs',
            'Good credit history (or first-time borrowers in Shishu category)',
        ],
        documents_required: [
            'Aadhaar Card and PAN Card',
            'Proof of business address',
            'Business plan / project report (for Kishore and Tarun)',
            'Bank account statements (last 6 months)',
            'Quotation for equipment if applicable',
        ],
        application_process: [
            'Visit any bank, MFI, or NBFC offering MUDRA loans',
            'Alternatively apply online at mudra.org.in or udyamimitra.in',
            'Choose loan category (Shishu / Kishore / Tarun)',
            'Fill application form and submit business details',
            'Submit KYC documents and business proof',
            'Loan sanction within 7–14 working days on verification',
        ],
        official_link: 'https://www.mudra.org.in',
        budget_allocation: 'Over ₹22 lakh crore disbursed to 40+ crore beneficiaries since 2015',
    },
    'Digital India': {
        name: 'Digital India Programme',
        launch_year: '2015',
        ministry: 'Ministry of Electronics & Information Technology (MeitY)',
        description: 'Digital India is a flagship programme to transform India into a digitally empowered society and knowledge economy. It focuses on three vision areas: digital infrastructure as a utility to every citizen, governance & services on demand, and digital empowerment of citizens through digital literacy and access.',
        benefits: [
            'High-speed internet access in rural areas through BharatNet',
            'e-Governance services: Aadhaar, DigiLocker, e-Hospital, UMANG app',
            'Digital literacy through PMGDISHA (6 crore+ trained)',
            'Common Service Centres (CSCs) for digital service delivery in villages',
            'Mobile Seva portal with 1200+ government mobile apps',
        ],
        eligibility: [
            'All Indian citizens benefit from Digital India initiatives',
            'PM Gramin Digital Saksharta Abhiyan (PMGDISHA): Rural household members',
            'Special focus on women, SC/ST communities, persons with disabilities',
            'CSC services available to all residents',
        ],
        documents_required: [
            'Aadhaar Card (for DigiLocker and e-services)',
            'Mobile number linked to Aadhaar (for OTP-based services)',
            'PAN Card (for financial e-services)',
        ],
        application_process: [
            'Download UMANG app or visit umang.gov.in for 1200+ services',
            'Register at digilocker.gov.in with Aadhaar for document wallet',
            'Enrol for digital literacy at pmgdisha.in',
            'Access government services via GeM, e-NAM, e-district portals',
            'Visit nearest CSC for assisted digital services',
        ],
        official_link: 'https://digitalindia.gov.in',
        budget_allocation: '₹1.13 lakh crore investment in digital infrastructure — 1.5 lakh CSCs operational',
    },
    'Skill India': {
        name: 'Skill India Mission (PMKVY)',
        launch_year: '2015',
        ministry: 'Ministry of Skill Development & Entrepreneurship',
        description: 'Skill India Mission (Pradhan Mantri Kaushal Vikas Yojana) aims to enable a large number of Indian youth to take up industry-relevant skill training that will help them secure better livelihoods. The scheme provides short-term training with monetary rewards and a National Skills Qualification Framework (NSQF) certificate.',
        benefits: [
            'Free short-term skill training (150–300 hours) across 40+ sectors',
            'Government-paid training with stipend and boarding/lodging support',
            'NSQF-aligned certification recognised by industry',
            'Placement assistance through Skill India Digital platform',
            'Monetary reward of ₹500–₹8,500 on certification',
        ],
        eligibility: [
            'Indian youth aged 15–45 years (18–45 for PMKVY 3.0)',
            'School/college dropouts or class 10/12 pass students',
            'Unemployed or underemployed seeking skill upgradation',
            'Existing workers seeking Recognition of Prior Learning (RPL)',
        ],
        documents_required: [
            'Aadhaar Card (mandatory for enrolment)',
            'Educational qualification certificates',
            'Bank account linked to Aadhaar (for monetary rewards)',
            'Passport-size photographs',
        ],
        application_process: [
            'Visit skillindiadigital.gov.in or nearest Training Centre',
            'Register with Aadhaar and mobile number',
            'Choose from 700+ job roles across 40+ sectors',
            'Complete free training at empanelled Training Centre',
            'Appear for assessment by third-party assessment body',
            'Receive NSQF certificate and placement support',
        ],
        official_link: 'https://skillindia.gov.in',
        budget_allocation: '₹12,000 crore for PMKVY 4.0 — 1.4 crore youth trained in PMKVY 3.0',
    },
};

const POPULAR_SCHEMES = [
    { name: 'PMAY', full: 'Pradhan Mantri Awas Yojana', desc: 'Affordable housing for all citizens', icon: '🏠' },
    { name: 'PM Kisan Samman Nidhi', full: 'PM Kisan Samman Nidhi', desc: 'Financial support ₹6000/year for farmers', icon: '🌾' },
    { name: 'Ayushman Bharat', full: 'Ayushman Bharat PM-JAY', desc: 'Health coverage up to ₹5 lakh per family', icon: '🏥' },
    { name: 'Swachh Bharat', full: 'Swachh Bharat Mission', desc: 'Sanitation and cleanliness for every household', icon: '🧹' },
    { name: 'Beti Bachao Beti Padhao', full: 'Beti Bachao Beti Padhao', desc: 'Welfare and education of the girl child', icon: '👧' },
    { name: 'Mudra Yojana', full: 'Pradhan Mantri Mudra Yojana', desc: 'Loans for micro & small enterprises', icon: '💼' },
    { name: 'Digital India', full: 'Digital India Programme', desc: 'Digital infrastructure & empowerment', icon: '💻' },
    { name: 'Skill India', full: 'Skill India Mission', desc: 'Skill development & training for youth', icon: '🎓' },
];

const LANG_OPTIONS: { value: PdfLanguage; label: string; flag: string }[] = [
    { value: 'en', label: 'English', flag: '🇬🇧' },
    { value: 'hi', label: 'हिंदी', flag: '🇮🇳' },
    { value: 'mr', label: 'मराठी', flag: '🫁' },
];

interface LocalDownload {
    scheme_name: string;
    icon: string;
    lang: PdfLanguage;
    theme: PdfTheme;
    downloaded_at: string;
    blob?: Blob;
}

// ─── PDF Options Modal ─────────────────────────────────────────────────────────
function PdfOptionsModal({
    scheme, onClose, onGenerate,
}: {
    scheme: typeof POPULAR_SCHEMES[0];
    onClose: () => void;
    onGenerate: (theme: PdfTheme, lang: PdfLanguage) => void;
}) {
    const [theme, setTheme] = useState<PdfTheme>('dark');
    const [lang, setLang] = useState<PdfLanguage>('en');

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }} onClick={onClose}>
            <div className="glass-card animate-slide-up"
                style={{ width: '100%', maxWidth: '26rem', padding: '1.75rem', position: 'relative' }}
                onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: '1rem', right: '1rem',
                    background: 'rgba(255,255,255,0.08)', border: 'none',
                    borderRadius: '0.5rem', padding: '0.25rem', cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
                }}><X size={16} /></button>

                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{scheme.icon}</div>
                    <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>Generate PDF Report</h2>
                    <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>{scheme.full}</p>
                </div>

                {/* Theme */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <Moon size={14} color="#60A5FA" />
                        <span style={{ color: 'rgba(255,255,255,0.70)', fontSize: '0.85rem', fontWeight: 600 }}>PDF Theme</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        {(['dark', 'light'] as PdfTheme[]).map(t => (
                            <button key={t} onClick={() => setTheme(t)} style={{
                                flex: 1, padding: '0.875rem', borderRadius: '0.75rem', cursor: 'pointer',
                                border: theme === t ? '2px solid #3B82F6' : '2px solid rgba(255,255,255,0.10)',
                                background: theme === t ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                                transition: 'all 0.2s',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    {t === 'dark' ? <Moon size={16} color={theme === 'dark' ? '#60A5FA' : 'rgba(255,255,255,0.4)'} />
                                        : <Sun size={16} color={theme === 'light' ? '#60A5FA' : 'rgba(255,255,255,0.4)'} />}
                                    <span style={{ color: theme === t ? '#60A5FA' : 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.85rem' }}>
                                        {t === 'dark' ? 'Dark' : 'Light'}
                                    </span>
                                </div>
                                <div style={{
                                    height: '3rem', borderRadius: '0.5rem',
                                    background: t === 'dark' ? 'linear-gradient(135deg,#060D1F,#0D1F3C)' : 'linear-gradient(135deg,#F8FAFF,#EFF6FF)',
                                    border: '1px solid rgba(255,255,255,0.10)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <div style={{ height: '4px', width: '60%', background: '#2563EB', borderRadius: '2px' }} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Language */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <Globe size={14} color="#60A5FA" />
                        <span style={{ color: 'rgba(255,255,255,0.70)', fontSize: '0.85rem', fontWeight: 600 }}>PDF Language</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {LANG_OPTIONS.map(opt => (
                            <button key={opt.value} onClick={() => setLang(opt.value)} style={{
                                flex: 1, padding: '0.625rem', borderRadius: '0.75rem', cursor: 'pointer',
                                border: lang === opt.value ? '2px solid #3B82F6' : '2px solid rgba(255,255,255,0.10)',
                                background: lang === opt.value ? 'rgba(59,130,246,0.20)' : 'rgba(255,255,255,0.04)',
                                color: lang === opt.value ? '#60A5FA' : 'rgba(255,255,255,0.50)',
                                fontWeight: lang === opt.value ? 700 : 500,
                                fontSize: '0.8rem', transition: 'all 0.2s',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
                            }}>
                                <span style={{ fontSize: '1.1rem' }}>{opt.flag}</span>
                                <span>{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <button onClick={() => onGenerate(theme, lang)} className="btn-primary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Sparkles size={16} /> Generate & Download PDF
                </button>
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SchemeExplorerPage() {
    const { user, language } = useAuth();
    const [supabaseSchemes, setSupabaseSchemes] = useState<SchemeRecord[]>([]);
    const [localDownloads, setLocalDownloads] = useState<LocalDownload[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState<typeof POPULAR_SCHEMES[0] | null>(null);

    useEffect(() => {
        if (!user) { setLoading(false); return; }
        schemeService.getSchemes(user.id)
            .then(setSupabaseSchemes)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [user]);

    const handleGenerate = async (theme: PdfTheme, lang: PdfLanguage) => {
        if (!modal || !user) return;
        const schemeName = modal.name;
        setModal(null);
        setGenerating(schemeName);
        const toastId = toast.loading(`Generating ${schemeName} PDF...`, { icon: '📄' });

        try {
            // 1. Try to get enhanced details from Gemini AI (non-blocking)
            let schemeDetails: SchemeDetails = SCHEME_DATA[schemeName] || {
                name: modal.full,
                description: `${modal.full} is a flagship Indian government scheme.`,
                benefits: ['Direct benefit transfer', 'Subsidized services', 'Improved access to government resources'],
                eligibility: ['Indian citizen', 'Meet scheme-specific criteria', 'Valid Aadhaar card required'],
                documents_required: ['Aadhaar Card', 'PAN Card', 'Bank Account Details', 'Income Certificate'],
                application_process: ['Visit official portal', 'Register with Aadhaar', 'Fill online form', 'Upload documents', 'Submit and track'],
                official_link: 'https://india.gov.in',
            };

            // Try Gemini for potentially richer/translated content (30s timeout)
            try {
                const geminiDetails = await Promise.race([
                    geminiService.getSchemeDetails(schemeName, lang),
                    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
                ]);
                if (geminiDetails && geminiDetails.description && geminiDetails.benefits?.length) {
                    schemeDetails = geminiDetails as SchemeDetails;
                }
            } catch {
                // Gemini failed — use hardcoded data, still generates PDF fine
                console.log(`Using fallback data for ${schemeName}`);
            }

            // 2. Generate PDF locally (always works)
            const citizenName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Citizen';
            const citizenEmail = user.email || 'citizen@senatebot.gov.in';
            const pdfBlob = generateSchemePdf(schemeDetails, citizenName, citizenEmail, theme, lang);

            // 3. Trigger browser download immediately
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${schemeName.replace(/\s+/g, '_')}_${lang}_${theme}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 3000);

            // 4. Track locally (always shows in history immediately)
            const localEntry: LocalDownload = {
                scheme_name: `${schemeName} (${lang.toUpperCase()} · ${theme})`,
                icon: modal.icon,
                lang,
                theme,
                downloaded_at: new Date().toISOString(),
                blob: pdfBlob,
            };
            setLocalDownloads(prev => [localEntry, ...prev]);

            toast.dismiss(toastId);
            toast.success(`${schemeName} PDF downloaded!`, { icon: '✅' });

            // 5. Try saving to Supabase (best-effort, non-blocking)
            try {
                await schemeService.generateAndStoreSchemePdf(user.id, schemeName, citizenName, citizenEmail, language);
                schemeService.getSchemes(user.id).then(setSupabaseSchemes).catch(() => { });
            } catch { /* Supabase storage not configured — local download already done */ }

        } catch (err) {
            toast.dismiss(toastId);
            console.error('PDF generation error:', err);
            toast.error('PDF generation failed. Please try again.');
        }
        setGenerating(null);
    };

    const handleReDownload = (d: LocalDownload) => {
        if (!d.blob) return;
        const url = URL.createObjectURL(d.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${d.scheme_name.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 3000);
        toast.success('Re-downloading PDF...', { icon: '📥' });
    };

    const filtered = POPULAR_SCHEMES.filter(s =>
        s.full.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.desc.toLowerCase().includes(search.toLowerCase())
    );

    // Merge local + supabase for history display
    const hasHistory = localDownloads.length > 0 || supabaseSchemes.length > 0;

    return (
        <>
            {modal && (
                <PdfOptionsModal
                    scheme={modal}
                    onClose={() => setModal(null)}
                    onGenerate={handleGenerate}
                />
            )}

            <div className="p-6 overflow-y-auto h-full flex flex-col gap-6">
                {/* Header */}
                <div className="animate-fade-in">
                    <h1 className="text-2xl font-extrabold text-white mb-1">Scheme Explorer</h1>
                    <p className="text-white/40 text-sm">
                        Browse 8 major government schemes — generate themed PDF reports in English, Hindi, or Marathi
                    </p>
                </div>

                {/* Search */}
                <div className="relative animate-slide-up">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search schemes by name or description..."
                        className="input-field pl-11"
                    />
                </div>

                {/* Scheme cards grid */}
                <div>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">
                        Popular Government Schemes ({filtered.length})
                    </p>
                    {filtered.length === 0 ? (
                        <div className="glass-card p-8 text-center">
                            <p className="text-white/40">No schemes match "{search}"</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 animate-slide-up"
                            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                            {filtered.map(scheme => (
                                <div key={scheme.name} className="glass-card p-5 flex flex-col hover:bg-white/8 transition-all duration-300 group">
                                    <div className="text-3xl mb-3 group-hover:scale-105 transition-transform">{scheme.icon}</div>
                                    <h3 className="font-bold text-white text-sm mb-1 leading-tight">{scheme.full}</h3>
                                    <p className="text-white/40 text-xs flex-1 mb-4 leading-relaxed">{scheme.desc}</p>
                                    <button
                                        onClick={() => setModal(scheme)}
                                        disabled={generating === scheme.name}
                                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl
                                            bg-electric-600/15 hover:bg-electric-600/25 border border-electric-500/25
                                            hover:border-electric-500/50 text-electric-400 text-xs font-semibold
                                            transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {generating === scheme.name ? (
                                            <><Loader2 size={12} className="animate-spin" /> Generating...</>
                                        ) : (
                                            <><Sparkles size={12} /> Generate PDF</>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Download History */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <BookOpen size={16} className="text-gold-400" />
                        <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Your Downloaded PDFs</p>
                        <button
                            onClick={() => user && schemeService.getSchemes(user.id).then(setSupabaseSchemes).catch(() => { })}
                            className="ml-auto text-white/30 hover:text-white/60 transition-colors"
                        >
                            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {!hasHistory && !loading ? (
                        <div className="glass-card p-10 text-center">
                            <BookOpen size={40} className="text-white/10 mx-auto mb-3" />
                            <p className="text-white/40 text-sm font-semibold">No PDFs downloaded yet</p>
                            <p className="text-white/25 text-xs mt-1">Click "Generate PDF" on any scheme above to get started</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {/* Local downloads (immediate, always available) */}
                            {localDownloads.map((d, i) => (
                                <div key={i} className="glass-card p-4 flex items-center gap-3 hover:bg-white/8 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0 text-lg">
                                        {d.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-semibold text-sm truncate">{d.scheme_name}</p>
                                        <p className="text-white/30 text-xs mt-0.5">
                                            {new Date(d.downloaded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                                            <CheckCircle size={9} /> Downloaded
                                        </span>
                                        {d.blob && (
                                            <button onClick={() => handleReDownload(d)}
                                                className="flex items-center gap-1 text-xs text-electric-400 hover:text-electric-300 font-semibold transition-colors">
                                                <Download size={13} /> Save again
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Supabase-stored PDFs (from cloud storage) */}
                            {supabaseSchemes.map(s => (
                                <div key={s.id} className="glass-card p-4 flex items-center gap-3 hover:bg-white/8 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
                                        <BookOpen size={16} className="text-gold-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-semibold text-sm truncate">{s.scheme_name}</p>
                                        <p className="text-white/30 text-xs mt-0.5">
                                            {new Date(s.created_at || '').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                    {s.pdf_url && (
                                        <a href={s.pdf_url} target="_blank" rel="noreferrer"
                                            className="flex items-center gap-1 text-xs text-electric-400 hover:text-electric-300 font-semibold transition-colors flex-shrink-0">
                                            <Download size={13} /> Download
                                        </a>
                                    )}
                                </div>
                            ))}

                            {loading && (
                                <div className="flex justify-center py-4">
                                    <Loader2 size={20} className="animate-spin text-electric-400" />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
