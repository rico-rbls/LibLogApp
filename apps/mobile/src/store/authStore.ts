/**
 * store/authStore.ts
 * ------------------
 * Zustand store for Supabase Auth session management (React Native).
 * Institution: Calauan Community College (CCC)
 *
 * Design decisions:
 * - Same pattern as the desktop authStore but adapted for React Native.
 * - No localStorage — Supabase handles session persistence via AsyncStorage
 *   when configured with a custom storage adapter (see supabase.ts).
 * - `isInitialized` prevents rendering the app shell before the session
 *   is resolved from Supabase on cold start.
 * - `onAuthStateChange` is wired at module load time so it fires once
 *   for the entire app lifetime and is never re-subscribed on re-renders.
 */
import { create } from "zustand";
import { supabase } from "../services/supabase";
import type { AuthStore } from "../types";

export const useAuthStore = create<AuthStore>((set) => ({
  // ── Initial State ──────────────────────────────────────────────────────────
  session: null,
  isInitialized: false,

  // ── Actions ────────────────────────────────────────────────────────────────
  setSession: (session) => set({ session }),

  setInitialized: () => set({ isInitialized: true }),

  signOut: async () => {
    await supabase.auth.signOut();
    // onAuthStateChange will fire SIGNED_OUT and call setSession(null)
    // No need to manually set session here — keep single source of truth.
  },
}));

// ─── Bootstrap: Wire Supabase Auth Listener ────────────────────────────────────
// Called once at module load time — safe because Supabase deduplicates listeners.
// This is intentionally outside the store creator to avoid re-subscribing.
supabase.auth.onAuthStateChange((event, session) => {
  const { setSession, setInitialized } = useAuthStore.getState();

  // Update session on every auth event (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.)
  setSession(session);

  // Mark as initialized after the first event — this is when we can safely
  // decide whether to show the login screen or the main app.
  if (!useAuthStore.getState().isInitialized) {
    setInitialized();
  }
});
