/**
 * services/supabase.ts
 * --------------------
 * Supabase client for the LibLog mobile app.
 * Mirrors the desktop pattern but uses Expo Constants for env vars
 * instead of Vite's import.meta.env.
 *
 * Institution: Calauan Community College (CCC)
 */
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase Environment Variables. Check app.config.ts.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
