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

### 2026-05-12 - Phase 4: Administrative Reporting (CHED Module)
* **Action:**
    * Installed `jspdf` + `jspdf-autotable` for PDF generation.
    * Built `ReportGenerator.tsx` — date range, patron type, and program (BSPA/MID) filters.
    * CSV export via native Blob (zero dependencies); PDF via jsPDF with CCC Purple header/footer branding, auto-pagination, and generation timestamp.
    * Export buttons disabled + professional empty state when no records found.
    * Program filter applied client-side (nested FK filter workaround for Supabase JS).
    * Wired `ReportGenerator` to `reports` route in `App.tsx`.
* **Validation:** `tsc --noEmit` → 0 errors.
* **Status:** All 4 phases complete. MVP ready for May 18 milestone. 🎯
### 2026-05-12 - Phase 5: Book Circulation Engine
* **Schema Discovery:** Confirmed `book_loans` (id, book_id→books, patron_id→patrons, borrowed_at, due_date[now+3d default], returned_at, status[active|returned|overdue], penalty_paid) and `books.status[active|donated]` from live Supabase DB before writing code.
* **Action:**
    * Extended `types/index.ts`: `Book.status`, `BookLoan`, `BookLoanWithRelations`, `NewBookLoan`.
    * `CirculationManager.tsx`: Split-panel Issue (patron+book select, availability guard, due-date preview) + Return (active loans table with date-fns overdue badge showing days + ₱5 penalty).
    * `OverdueDashboard.tsx`: Queries `due_date < NOW() AND status = 'active'`; per-row penalty = `differenceInDays(now, due_date) × ₱5`; severity coding (≥7d = red); "Settle & Return" mutation closes loan + marks `penalty_paid = true` + restores `available_copies`.
    * `BooksManager.tsx`: Added `status` column, `markBookDonated` mutation (sets status='donated', available_copies=0), Gift icon button, grays out donated rows, disables Edit on donated books.
    * `SidebarLayout.tsx`: Added Circulation and Overdue nav items (BookMarked + AlertTriangle icons).
    * `App.tsx`: Wired `circulation` and `overdue` routes.
* **Validation:** `tsc --noEmit` → 0 errors.
* **Status:** Phase 5 complete — full circulation lifecycle (Issue → Return → Overdue/Penalty → Settle). 📚

### May 12, 2026 01:01 PM - Automated Sync
* Restructured App.tsx and SidebarLayout to enforce strict IA. Separated Catalog from Attendance and resolved component bleeding. Consolidated code to master branch.

### May 12, 2026 01:32 PM - Automated Sync
* Established Phase 9 Monorepo: cleaned root package.json, fixed apps/desktop/tsconfig.json (removed Expo reference), corrected workspace paths to point at apps/desktop/liblog-desktop. TSC passes clean.

### May 12, 2026 01:39 PM - Automated Sync
* Added scaffold_component.py to automate component creation with CCC branding. Fixed path logic to correctly target the desktop workspace. Updated OVERVIEW.md.

### May 12, 2026 01:45 PM - Automated Sync
* Built PenaltyLedger with React Query fetching overdue book_loans, client-side penalty calc at PHP5/day, Settle Payment mutation using SUCCESS_GREEN (#10B981). Fixed scaffold_component.py JSX comment f-string SyntaxError. Wired into overdue route in App.tsx.
