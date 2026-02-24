import { supabase } from './supabaseClient';

export interface Complaint {
    id?: string;
    user_id?: string;
    complaint: string;
    location: string;
    details: string;
    status: string;
    created_at?: string;
}

export const complaintService = {
    async fileComplaint(userId: string, complaint: string, location: string, details: string): Promise<Complaint> {
        const { data, error } = await supabase
            .from('complaints')
            .insert({ user_id: userId, complaint, location, details, status: 'Pending' })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async getComplaints(userId: string): Promise<Complaint[]> {
        const { data, error } = await supabase
            .from('complaints')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async escalate(complaintId: string): Promise<void> {
        const { error } = await supabase
            .from('complaints')
            .update({ status: 'Under Review' })
            .eq('id', complaintId);
        if (error) throw error;
    },
};
