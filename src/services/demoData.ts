// ─── Sample data shown in Demo Mode ──────────────────────────────────────────
// All pages check isDemoMode from AuthContext and use this data instead of
// fetching from Supabase — ensures judges always see a rich, populated UI.

import type { Application } from './applicationService';
import type { Complaint } from './complaintService';
import type { SchemeRecord } from './schemeService';

export const DEMO_APPLICATIONS: Application[] = [
    {
        id: 'demo-1',
        app_id: 'SB-2026-4821',
        user_id: 'demo',
        type: 'Income Certificate',
        status: 'Approved',
        details: { name: 'Rajesh Kumar', aadhaar: '****3456', income: '₹1,80,000', address: 'Plot 45, Sector 7, Nashik, MH' },
        document_urls: [],
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'demo-2',
        app_id: 'SB-2026-3102',
        user_id: 'demo',
        type: 'Caste Certificate',
        status: 'Pending',
        details: { name: 'Priya Sharma', aadhaar: '****7890', caste: 'OBC', address: '12, MG Road, Pune, MH' },
        document_urls: [],
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'demo-3',
        app_id: 'SB-2026-1567',
        user_id: 'demo',
        type: 'Residence Certificate',
        status: 'Approved',
        details: { name: 'Amit Patil', aadhaar: '****2341', address: 'Flat 3B, Shivaji Nagar, Nagpur, MH', years: '5 years' },
        document_urls: [],
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'demo-4',
        app_id: 'SB-2026-0988',
        user_id: 'demo',
        type: 'Income Certificate',
        status: 'Under Review',
        details: { name: 'Sunita Desai', aadhaar: '****6612', income: '₹2,20,000', address: 'B-7, CIDCO Colony, Aurangabad, MH' },
        document_urls: [],
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
];

export const DEMO_COMPLAINTS: Complaint[] = [
    {
        id: 'demo-c1',
        user_id: 'demo',
        complaint: 'Street light not working for 3 weeks',
        location: 'Ward 12, Nashik',
        details: 'All 6 street lights in Ward 12 sector B have not been working for 3 weeks. Safety risk at night.',
        status: 'Pending',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'demo-c2',
        user_id: 'demo',
        complaint: 'Water supply disrupted in residential area',
        location: 'Sector 5, Nashik',
        details: 'No water supply for 4 days in Sector 5. Residents facing severe hardship.',
        status: 'Under Review',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'demo-c3',
        user_id: 'demo',
        complaint: 'Road pothole causing accidents near school',
        location: 'MG Road, Pune',
        details: 'Large pothole near Pune English Medium School has caused 2 accidents this month. Urgent repair needed.',
        status: 'Approved',
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
];

export const DEMO_SCHEMES: SchemeRecord[] = [
    {
        id: 'demo-s1',
        user_id: 'demo',
        scheme_name: 'Pradhan Mantri Awas Yojana (PMAY)',
        pdf_url: '#',
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'demo-s2',
        user_id: 'demo',
        scheme_name: 'PM Kisan Samman Nidhi',
        pdf_url: '#',
        created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'demo-s3',
        user_id: 'demo',
        scheme_name: 'Ayushman Bharat PM-JAY',
        pdf_url: '#',
        created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    },
];
