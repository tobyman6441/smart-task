import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    return null;
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

export const supabase = typeof window !== 'undefined' ? getSupabaseClient() : null; 