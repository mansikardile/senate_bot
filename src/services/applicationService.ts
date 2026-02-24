import { supabase } from './supabaseClient';
import { generateApplicationId } from '../utils/applicationId';

export interface Application {
    id?: string;
    user_id?: string;
    app_id: string;
    type: string;
    status: string;
    details?: Record<string, string>;
    document_urls?: string[];
    created_at?: string;
}

export const applicationService = {
    async createApplication(userId: string, type: string, details: Record<string, string>): Promise<Application> {
        const app_id = generateApplicationId();
        const { data, error } = await supabase
            .from('applications')
            .insert({
                user_id: userId,
                app_id,
                type,
                status: 'Pending',
                details,
                document_urls: [],
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async getApplications(userId: string): Promise<Application[]> {
        const { data, error } = await supabase
            .from('applications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async getApplicationByAppId(appId: string): Promise<Application | null> {
        const { data, error } = await supabase
            .from('applications')
            .select('*')
            .eq('app_id', appId)
            .single();
        if (error) return null;
        return data;
    },

    async updateStatus(appId: string, status: string): Promise<void> {
        const { error } = await supabase
            .from('applications')
            .update({ status })
            .eq('app_id', appId);
        if (error) throw error;
    },

    async uploadDocument(userId: string, file: File, appId: string): Promise<string> {
        const filePath = `${userId}/${appId}/${file.name}`;
        const { error } = await supabase.storage
            .from('documents')
            .upload(filePath, file, { upsert: true });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);
        return publicUrl;
    },

    async linkDocumentToApplication(appId: string, docUrl: string): Promise<void> {
        const { data: app } = await supabase.from('applications').select('document_urls').eq('app_id', appId).single();
        const urls = [...(app?.document_urls || []), docUrl];
        await supabase.from('applications').update({ document_urls: urls }).eq('app_id', appId);
    },
};
