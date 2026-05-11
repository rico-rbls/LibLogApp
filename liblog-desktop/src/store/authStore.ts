/**
 * authStore.ts
 * ------------
 * Zustand store for Supabase Auth session management.
 * Institution: Calauan Community College (CCC)
 *
 * Design decisions:
 * - `isInitialized` prevents the flash of the login screen while Supabase
 *   resolves the existing session from localStorage on page load.
 * - `onAuthStateChange` is wired here (not in a component) so it fires once
 *   for the entire app lifetime and is never re-subscribed on re-renders.
 * - `signOut` calls supabase.auth.signOut(), which triggers onAuthStateChange
 *   → SIGNED_OUT → setSession(null), keeping the store in sync automatically.
 *
 * Session persistence:
 * - Supabase JS v2 automatically persists the session in localStorage.
 * - On page refresh, onAuthStateChange fires INITIAL_SESSION with the stored
 *   session, which we write to Zustand via setSession → setInitialized.
 * - No manual localStorage reads are needed.
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import type { AuthStore } from '../types';

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
  // decide whether to show AuthGate or the dashboard.
  if (!useAuthStore.getState().isInitialized) {
    setInitialized();
  }
});
