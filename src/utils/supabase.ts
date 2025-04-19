import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const getSupabaseClient = () => {
  if (typeof window === 'undefined') {
    return null; // Return null during SSR
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

// Create a singleton instance
let supabaseInstance: ReturnType<typeof getSupabaseClient> | null = null;

export const supabase = () => {
  if (!supabaseInstance && typeof window !== 'undefined') {
    supabaseInstance = getSupabaseClient();
  }
  return supabaseInstance;
}; 