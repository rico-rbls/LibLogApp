# Directive: Desktop Phase 1 - Authentication & Global Layout

## Objective
Establish the secure entry gate and the foundational layout for the Librarian Desktop Dashboard. The system must restrict access to authenticated admin users and provide a persistent sidebar navigation framework.

## Context & Tech Stack
* **Framework:** Vite + React + TypeScript
* **State Management:** Zustand (for Auth Session)
* **Backend:** `@supabase/supabase-js` (via `src/services/supabase.ts`)
* **Styling:** TailwindCSS
* **Design Token:** Primary branding MUST use CCC Purple (`#652D90`).

## Component Requirements
1. **`AuthGate.tsx`:** - A high-contrast login screen utilizing `#652D90` for the submit button.
   - Use `supabase.auth.signInWithPassword`.
   - On success, save the session to the Zustand store and redirect to the dashboard.
2. **`SidebarLayout.tsx`:**
   - A persistent left-hand sidebar containing navigation links: Dashboard, Books, Patrons, Live Monitor, Reports.
   - The active route must be visually highlighted using the CCC Purple design token.
   - Include a "Sign Out" button at the bottom.

## Execution Rules (Self-Annealing)
* Do not bypass TypeScript strict mode. Define interfaces for your Zustand store.
* Ensure the `.env` variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are utilized correctly without hardcoding keys.