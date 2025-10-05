import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your_supabase_project_url';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your_supabase_anon_key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types
export type { SetNumberType, PoultryData, CalculatedLedger, DatabasePoultryData } from '../types';
