import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = 'https://dsxngeuphqvxovpllaau.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzeG5nZXVwaHF2eG92cGxsYWF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNzc4NzQsImV4cCI6MjA2MDY1Mzg3NH0.DSvTlLRFYyXnEn2RgRKrl4AWOA8glTyw-87fhiR4zkQ';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey); 