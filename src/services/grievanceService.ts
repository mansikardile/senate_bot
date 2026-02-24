import { supabase } from './supabaseClient';

export interface Grievance {
    id?: string;
    user_id: string;
    department: string;
    complaint: string;
    status: string;
    escalated?: boolean;
    created_at?: string;
}

export const grievanceService = {
    async file(data: Omit<Grievance, 'id' | 'created_at'>) {
        const { data: rec, error } = await supabase
            .from('grievances')
            .insert({ ...data, status: 'Submitted' })
            .select()
            .single();
        if (error) throw error;
        return rec as Grievance;
    },

    async getByUser(userId: string): Promise<Grievance[]> {
        const { data, error } = await supabase
            .from('grievances')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) return [];
        return (data || []) as Grievance[];
    },

    async escalate(id: string) {
        const { error } = await supabase
            .from('grievances')
            .update({ status: 'Escalated', escalated: true })
            .eq('id', id);
        if (error) throw error;
    },
};
