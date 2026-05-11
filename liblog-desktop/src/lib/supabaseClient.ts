/**
 * supabaseClient.ts
 * -----------------
 * Supabase connection layer for LibLog Librarian Dashboard.
 * Institution: Calauan Community College (CCC)
 *
 * Reads credentials from environment variables (.env file at project root).
 * Required .env keys:
 *   VITE_SUPABASE_URL  — Your Supabase project URL
 *   VITE_SUPABASE_ANON_KEY — Your Supabase public anon key
 *
 * NEVER commit your .env file. Use .env.example for documentation.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Guard: fail fast in development if env vars are missing
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[LibLog] Missing Supabase environment variables.\n' +
    'Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.'
  );
}

/**
 * The singleton Supabase client.
 * Import this wherever you need DB access — do not create new instances.
 *
 * @example
 * import { supabase } from '@/lib/supabaseClient';
 * const { data, error } = await supabase.from('library_logs').select('*');
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
