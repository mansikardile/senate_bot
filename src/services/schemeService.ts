import { supabase } from './supabaseClient';
import { generateSchemePdf } from './pdfService';
import { geminiService } from './geminiService';
import type { SchemeDetails } from './pdfService';

export interface SchemeRecord {
    id?: string;
    user_id?: string;
    scheme_name: string;
    pdf_url: string;
    created_at?: string;
}

export const schemeService = {
    async generateAndStoreSchemePdf(
        userId: string,
        schemeName: string,
        citizenName: string,
        citizenEmail: string,
        language: string = 'en'
    ): Promise<{ pdfUrl: string; record: SchemeRecord }> {
        // 1. Get scheme details from Gemini
        const rawText = await geminiService.getSchemeInfo(schemeName, language);
        const parsed = geminiService.parseSchemeDetails(rawText);

        let schemeDetails: SchemeDetails;
        if (parsed?.scheme_details) {
            schemeDetails = parsed.scheme_details;
        } else {
            // Fallback scheme details
            schemeDetails = {
                name: schemeName,
                description: `${schemeName} is an Indian government scheme aimed at improving citizen welfare and providing financial assistance.`,
                benefits: ['Direct benefit transfer', 'Subsidized services', 'Improved access to government resources'],
                eligibility: ['Indian citizen', 'Meet income criteria', 'Valid government ID required'],
                documents_required: ['Aadhaar Card', 'PAN Card', 'Bank Account Details', 'Income Certificate'],
                application_process: ['Visit official portal', 'Register with Aadhaar', 'Fill application form', 'Upload documents', 'Submit and track'],
                official_link: 'https://india.gov.in',
            };
        }

        // 2. Generate PDF
        const pdfBlob = generateSchemePdf(schemeDetails, citizenName, citizenEmail);

        // 3. Upload to Supabase storage
        const fileName = `${userId}/${schemeName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        const { error: uploadError } = await supabase.storage
            .from('scheme-pdfs')
            .upload(fileName, pdfBlob, { contentType: 'application/pdf', upsert: true });

        if (uploadError) {
            // Return downloadable blob URL as fallback
            const blobUrl = URL.createObjectURL(pdfBlob);
            return {
                pdfUrl: blobUrl,
                record: { scheme_name: schemeName, pdf_url: blobUrl, user_id: userId },
            };
        }

        const { data: { publicUrl } } = supabase.storage.from('scheme-pdfs').getPublicUrl(fileName);

        // 4. Save to schemes table
        const { data: record } = await supabase
            .from('schemes')
            .insert({ user_id: userId, scheme_name: schemeName, pdf_url: publicUrl })
            .select()
            .single();

        return { pdfUrl: publicUrl, record: record || { scheme_name: schemeName, pdf_url: publicUrl } };
    },

    async getSchemes(userId: string): Promise<SchemeRecord[]> {
        const { data, error } = await supabase
            .from('schemes')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },
};
