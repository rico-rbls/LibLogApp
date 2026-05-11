import { createClient } from '@supabase/supabase-js';

// Vite strictly requires import.meta.env for environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase Environment Variables. Check your .env file.');
}

// Export the singleton instance of the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
