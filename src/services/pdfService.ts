import jsPDF from 'jspdf';

export interface SchemeDetails {
    name: string;
    launch_year?: string;
    ministry?: string;
    description: string;
    benefits: string[];
    eligibility: string[];
    documents_required: string[];
    application_process: string[];
    official_link?: string;
    budget_allocation?: string;
}

export type PdfTheme = 'dark' | 'light';
export type PdfLanguage = 'en' | 'hi' | 'mr';

// Section title translations
const LABELS: Record<PdfLanguage, {
    benefits: string; eligibility: string; documents: string;
    process: string; official: string; budget: string;
    generated: string; citizen: string; tagline: string; initiative: string;
    ministry: string; launched: string;
}> = {
    en: {
        benefits: '  Benefits',
        eligibility: '  Eligibility Criteria',
        documents: '  Documents Required',
        process: '  Application Process',
        official: '  Official Website:',
        budget: '  Budget / Financial Outlay:',
        generated: 'Generated:',
        citizen: 'Citizen:',
        tagline: 'Autonomous Digital Governance for Every Citizen',
        initiative: 'Government of India | Digital India Initiative',
        ministry: 'Ministry:',
        launched: 'Launched:',
    },
    hi: {
        benefits: '  लाभ',
        eligibility: '  पात्रता मानदंड',
        documents: '  आवश्यक दस्तावेज़',
        process: '  आवेदन प्रक्रिया',
        official: '  आधिकारिक वेबसाइट:',
        budget: '  बजट / वित्तीय आवंटन:',
        generated: 'उत्पन्न:',
        citizen: 'नागरिक:',
        tagline: 'प्रत्येक नागरिक के लिए स्वायत्त डिजिटल प्रशासन',
        initiative: 'भारत सरकार | डिजिटल इंडिया पहल',
        ministry: 'मंत्रालय:',
        launched: 'शुरू:',
    },
    mr: {
        benefits: '  फायदे',
        eligibility: '  पात्रता निकष',
        documents: '  आवश्यक कागदपत्रे',
        process: '  अर्ज प्रक्रिया',
        official: '  अधिकृत संकेतस्थळ:',
        budget: '  अर्थसंकल्प / आर्थिक तरतूद:',
        generated: 'तयार केले:',
        citizen: 'नागरिक:',
        tagline: 'प्रत्येक नागरिकासाठी स्वायत्त डिजिटल प्रशासन',
        initiative: 'भारत सरकार | डिजिटल इंडिया उपक्रम',
        ministry: 'मंत्रालय:',
        launched: 'सुरू:',
    },
};

// ─── Theme palettes ──────────────────────────────────────────────────────────
interface ThemePalette {
    pageBg: [number, number, number];
    headerBg: [number, number, number];
    headerAccent: [number, number, number];
    footerBg: [number, number, number];
    sectionHeaderBg: [number, number, number];
    titleCardBg: [number, number, number];
    linkCardBg: [number, number, number];
    accentBlue: [number, number, number];
    accentGold: [number, number, number];
    textPrimary: [number, number, number];
    textSecondary: [number, number, number];
    textMuted: [number, number, number];
    textFooter: [number, number, number];
    sectionText: [number, number, number];
}

const DARK_THEME: ThemePalette = {
    pageBg: [6, 13, 31],
    headerBg: [6, 13, 31],
    headerAccent: [37, 99, 235],
    footerBg: [6, 13, 31],
    sectionHeaderBg: [26, 42, 78],
    titleCardBg: [15, 25, 55],
    linkCardBg: [18, 35, 70],
    accentBlue: [96, 165, 250],
    accentGold: [245, 158, 11],
    textPrimary: [255, 255, 255],
    textSecondary: [150, 170, 210],
    textMuted: [120, 145, 190],
    textFooter: [100, 130, 180],
    sectionText: [200, 215, 240],
};

const LIGHT_THEME: ThemePalette = {
    pageBg: [248, 250, 255],
    headerBg: [255, 255, 255],
    headerAccent: [37, 99, 235],
    footerBg: [240, 245, 255],
    sectionHeaderBg: [219, 234, 254],
    titleCardBg: [239, 246, 255],
    linkCardBg: [224, 238, 255],
    accentBlue: [37, 99, 235],
    accentGold: [180, 110, 0],
    textPrimary: [15, 30, 60],
    textSecondary: [50, 80, 140],
    textMuted: [80, 100, 150],
    textFooter: [100, 120, 170],
    sectionText: [30, 50, 90],
};

// ─── Main export ─────────────────────────────────────────────────────────────
export function generateSchemePdf(
    schemeDetails: SchemeDetails,
    citizenName: string,
    citizenEmail: string,
    theme: PdfTheme = 'dark',
    language: PdfLanguage = 'en'
): Blob {
    const t = theme === 'dark' ? DARK_THEME : LIGHT_THEME;
    const L = LABELS[language];

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    let y = 0;

    // Fill page background for light theme
    if (theme === 'light') {
        doc.setFillColor(...t.pageBg);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
    }

    // ─── Helper: wrap text ───────────────────────────────────────────────
    const addWrappedText = (
        text: string, x: number, yPos: number, maxWidth: number,
        lineHeight: number, fontSize: number,
        fontStyle = 'normal', color: [number, number, number] = t.sectionText
    ): number => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', fontStyle);
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
            if (yPos > pageHeight - 30) {
                doc.addPage();
                if (theme === 'light') {
                    doc.setFillColor(...t.pageBg);
                    doc.rect(0, 0, pageWidth, pageHeight, 'F');
                }
                yPos = 20;
            }
            doc.text(line, x, yPos);
            yPos += lineHeight;
        });
        return yPos;
    };

    const addSection = (title: string, items: string[], startY: number): number => {
        let sy = startY;
        if (sy + 20 > pageHeight - 30) {
            doc.addPage();
            if (theme === 'light') {
                doc.setFillColor(...t.pageBg);
                doc.rect(0, 0, pageWidth, pageHeight, 'F');
            }
            sy = 20;
        }
        // Section header
        doc.setFillColor(...t.sectionHeaderBg);
        doc.roundedRect(margin, sy, contentWidth, 10, 2, 2, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...t.accentBlue);
        doc.text(title, margin + 4, sy + 7);
        sy += 14;

        items.forEach((item, i) => {
            if (sy > pageHeight - 30) {
                doc.addPage();
                if (theme === 'light') {
                    doc.setFillColor(...t.pageBg);
                    doc.rect(0, 0, pageWidth, pageHeight, 'F');
                }
                sy = 20;
            }
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...t.sectionText);
            const bullet = `${i + 1}. `;
            const wrapped = doc.splitTextToSize(`${bullet}${item}`, contentWidth - 6);
            wrapped.forEach((line: string) => {
                doc.text(line, margin + 4, sy);
                sy += 6;
            });
            sy += 1;
        });
        return sy + 4;
    };

    // ─── HEADER ─────────────────────────────────────────────────────────
    doc.setFillColor(...t.headerBg);
    doc.rect(0, 0, pageWidth, 55, 'F');
    // Blue accent stripe
    doc.setFillColor(...t.headerAccent);
    doc.rect(0, 52, pageWidth, 3, 'F');
    // India tricolor dots
    doc.setFillColor(255, 153, 51);
    doc.circle(pageWidth - 14, 12, 3, 'F');
    doc.setFillColor(theme === 'light' ? 200 : 255, theme === 'light' ? 200 : 255, theme === 'light' ? 200 : 255);
    doc.circle(pageWidth - 14, 21, 3, 'F');
    doc.setFillColor(19, 136, 8);
    doc.circle(pageWidth - 14, 30, 3, 'F');

    // Logo text
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...t.accentBlue);
    doc.text('Senate Bot', margin, 18);
    doc.setTextColor(...t.accentGold);
    doc.text('Administrator', margin + 58, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...t.textSecondary);
    doc.text(L.tagline, margin, 26);
    doc.text(L.initiative, margin, 33);

    // Date & citizen
    doc.setFontSize(8);
    doc.setTextColor(...t.textMuted);
    const dateStr = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`${L.generated} ${dateStr}`, margin, 42);
    doc.text(`${L.citizen} ${citizenName} | ${citizenEmail}`, margin, 48);

    // Theme/Language badge (top right)
    doc.setFontSize(7);
    doc.setTextColor(...t.textMuted);
    const badge = `${theme === 'dark' ? '● Dark' : '○ Light'} | ${language.toUpperCase()}`;
    doc.text(badge, pageWidth - margin - doc.getTextWidth(badge), 48);

    y = 62;

    // ─── SCHEME TITLE ────────────────────────────────────────────────────
    doc.setFillColor(...t.titleCardBg);
    doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F');
    doc.setFillColor(...t.headerAccent);
    doc.roundedRect(margin, y, 4, 20, 1, 1, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...t.textPrimary);
    doc.text(schemeDetails.name, margin + 8, y + 9);
    if (schemeDetails.ministry) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...t.textSecondary);
        doc.text(
            `${L.ministry} ${schemeDetails.ministry}${schemeDetails.launch_year ? ` | ${L.launched} ${schemeDetails.launch_year}` : ''}`,
            margin + 8, y + 16
        );
    }
    y += 26;

    // ─── DESCRIPTION ─────────────────────────────────────────────────────
    y += 6;
    y = addWrappedText(schemeDetails.description, margin, y, contentWidth, 6, 10, 'normal', t.sectionText);
    y += 6;

    // ─── SECTIONS ────────────────────────────────────────────────────────
    y = addSection(L.benefits, schemeDetails.benefits, y);
    y = addSection(L.eligibility, schemeDetails.eligibility, y);
    y = addSection(L.documents, schemeDetails.documents_required, y);
    y = addSection(L.process, schemeDetails.application_process, y);

    // ─── OFFICIAL LINK ────────────────────────────────────────────────────
    if (schemeDetails.official_link) {
        if (y + 16 > pageHeight - 30) { doc.addPage(); y = 20; }
        doc.setFillColor(...t.linkCardBg);
        doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...t.accentBlue);
        doc.text(L.official, margin + 4, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.text(schemeDetails.official_link, margin + 40, y + 5);
        y += 16;
    }

    // ─── BUDGET INFO ──────────────────────────────────────────────────────
    if (schemeDetails.budget_allocation) {
        if (y + 12 > pageHeight - 30) { doc.addPage(); y = 20; }
        doc.setFillColor(...t.linkCardBg);
        doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...t.accentGold);
        doc.text(L.budget, margin + 4, y + 7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...t.sectionText);
        doc.text(schemeDetails.budget_allocation, margin + 55, y + 7);
        y += 14;
    }

    // ─── FOOTER (all pages) ──────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalPages = (doc.internal as any).getNumberOfPages() as number;
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFillColor(...t.footerBg);
        doc.rect(0, pageHeight - 16, pageWidth, 16, 'F');
        doc.setFillColor(...t.headerAccent);
        doc.rect(0, pageHeight - 17, pageWidth, 1, 'F');
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...t.textFooter);
        doc.text('Senate Bot Administrator | Powered by Gemini AI | Digital India', margin, pageHeight - 7);
        doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin - 18, pageHeight - 7);
    }

    return doc.output('blob');
}
