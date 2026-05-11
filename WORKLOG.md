# CodeBlue Development Worklog

## Sprint to May 18

### 2026-05-12 - Environment & Database Initialization
* **Action:** Initialized Antigravity workspace, configured Supabase PostgreSQL schema, applied Row Level Security (RLS).
* **Validation:** Verified 'handle_new_user' trigger and database connection.

### 2026-05-12 - MVP CRUD Tables & Desktop Scaffolding
* **Action:** 
    * Scaffolded `liblog-desktop` with Vite + React + TypeScript.
    * Implemented `BooksManager.tsx` with full CRUD (Add/Delete/View) and React Query.
    * Implemented `LogbookManager.tsx` with real-time relational joins (Logbook -> Patrons).
    * Created `DashboardLayout.tsx` for view switching with CCC branding (#652D90).
* **Validation:** 
    * Verified strict TypeScript interfaces for Supabase joins (Patron | null).
    * Confirmed zero `tsc --noEmit` errors.
    * Verified manual refresh and auto-refetch (30s) for logbook.
* **Next Target:** Feature completion and UI/UX polish for 80% MVP.

### 2026-05-12 - Phase 1: Authentication & Global Layout
* **Action:**
    * Built `AuthGate.tsx` — split-panel login screen with `supabase.auth.signInWithPassword`, CCC Purple (`#652D90`) button, inline error display, show/hide password.
    * Built `SidebarLayout.tsx` — persistent sidebar with all 5 nav items (Dashboard, Books, Patrons, Live Monitor, Reports), active state in CCC Purple, collapsible, user email display, sign-out.
    * Built `authStore.ts` (Zustand) — typed `AuthStore` interface, `onAuthStateChange` bootstrapped at module load for session persistence across page refreshes.
    * Rewrote `App.tsx` as a 3-phase auth router: Loading Spinner → AuthGate → SidebarLayout.
    * Extended `src/types/index.ts` with `AuthState`, `AuthActions`, `AuthStore` interfaces.
* **Validation:**
    * `tsc --noEmit` → 0 errors.
    * Session persistence confirmed: Supabase JS v2 stores session in localStorage; `onAuthStateChange` fires `INITIAL_SESSION` on reload.
* **Refactor:** Migrated `src/lib/supabaseClient.ts` to `src/services/supabase.ts` per directive alignment and user request.
* **Next Target:** Phase 2 — Patron Manager CRUD, Phase 3 — Live Monitor (Realtime).

### 2026-05-12 - Phase 2: Patron & Book Engine (CRUD)
* **Action:**
    * Upgraded `BooksManager.tsx` — added "search as you type" (client-side filter via `useDeferredValue` + `useMemo`, zero extra HTTP requests), Edit modal with `updateMutation`, Pencil icon from `lucide-react`.
    * Built `PatronManager.tsx` — joined Supabase query (`patrons + programs`), search filter on name/ID, patron-type filter tabs with live counts, Add/Edit/Delete modals, conditional Program+Year Level fields for students, role badges (Student=blue, Faculty=green, Visitor=orange).
    * Extended `src/types/index.ts` with `Program`, updated `Patron` with real schema fields (`program_id`, `year_level`, `programs` relation), added `NewPatron` type.
    * Wired `PatronManager` to the `patrons` nav route in `App.tsx`.
* **Validation:**
    * `tsc --noEmit` → 0 errors.
    * All mutations call `queryClient.invalidateQueries` on success.
* **Next Target:** Phase 3 — Live Monitor (Supabase Realtime subscriptions).

### 2026-05-12 - Phase 3: Real-Time Attendance Monitor
* **Action:**
    * Built `LiveMonitor.tsx` — Supabase Realtime channel on `library_logs` (`INSERT` → prepend to cached list + green pulse animation, `UPDATE` → invalidate React Query cache).
    * Realtime channel properly removed in `useEffect` cleanup (prevents memory leaks per directive).
    * Manual Time-Out button — Supabase `UPDATE` sets `time_out = now()`, `status = 'completed'` on the targeted row.
    * 3-stat overview bar (Currently Inside / Checked Out / Total Today) derived from cached data.
    * Realtime connection status badge (Live / Connecting / Disconnected) with Wifi icon.
    * **Self-Annealing Fix:** Corrected `LogEntry.student_id` (was wrongly typed as `patron_id`). DB column is `student_id`. Also added `auto-closed` to status union and `device_id` field.
    * Wired `LiveMonitor` to `live-monitor` route in `App.tsx`.
* **Validation:**
    * `tsc --noEmit` → 0 errors.
    * `patron_id` references confirmed to be comments only — no runtime breakage.
* **Next Target:** Phase 4 — Reports (CSV/PDF export, date range filters).