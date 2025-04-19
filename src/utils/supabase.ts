import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

export const supabase = typeof window !== 'undefined' ? getSupabaseClient() : null; 