import { supabase } from './supabaseClient';

export interface BirthCertApplication {
    id?: string;
    user_id: string;
    child_name: string;
    dob: string;
    place_of_birth: string;
    father_name: string;
    mother_name: string;
    address: string;
    status: string;
    escalated?: boolean;
    created_at?: string;
}

export const birthCertService = {
    async create(data: Omit<BirthCertApplication, 'id' | 'created_at'>) {
        const { data: rec, error } = await supabase
            .from('birth_certificate_applications')
            .insert({ ...data, status: 'Approved' })
            .select()
            .single();
        if (error) throw error;
        return rec as BirthCertApplication;
    },

    async getByUser(userId: string): Promise<BirthCertApplication[]> {
        const { data, error } = await supabase
            .from('birth_certificate_applications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) return [];
        return (data || []) as BirthCertApplication[];
    },

    async escalate(id: string) {
        const { error } = await supabase
            .from('birth_certificate_applications')
            .update({ status: 'Escalated', escalated: true })
            .eq('id', id);
        if (error) throw error;
    },
};
