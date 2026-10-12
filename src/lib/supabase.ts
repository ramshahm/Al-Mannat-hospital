import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

export type FeedbackRow = {
  id: string;
  department: string;
  doctor_name: string | null;
  rating: number;
  is_positive: boolean;
  google_review_clicked: boolean;
  feedback_tags: string[] | null;
  message: string | null;
  patient_name: string | null;
  patient_mobile: string | null;
  patient_room: string | null;
  status: 'pending' | 'resolved' | 'archived';
  created_at: string;
};

export type AppSettings = {
  id: number;
  google_review_url: string;
  whatsapp_number: string;
  hospital_name: string;
  hospital_address: string;
  hospital_phone: string;
  updated_at: string;
};

export const DEPARTMENTS = [
  'Orthopaedic Care',
  'General Physician',
  'Physiotherapy',
  'Front Desk & Billing',
  'General Care',
] as const;

export const FEEDBACK_TAGS = [
  'Waiting Time',
  'Staff Behavior',
  'Hygiene',
  'Doctor Consultation',
  'Billing',
] as const;
