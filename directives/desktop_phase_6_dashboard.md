# Directive: Desktop Phase 6 - Dashboard UX & Routing Fix

## Objective
Fix the main application router so the Dashboard path does not render the Books component. Build a high-usability `DashboardHome.tsx` component that serves as the central Business Intelligence (BI) hub for the CCC Librarian.

## Context & Tech Stack
* **Framework:** Vite + React + TypeScript + TailwindCSS
* **Backend:** `@supabase/supabase-js`
* **Icons:** `lucide-react`

## Bug Fix Requirement
* Inspect `src/App.tsx` (or the main router file). Ensure the `/` or `/dashboard` route points to `<DashboardHome />` and the `/books` route points to `<BooksManager />`.

## Component Requirements (`DashboardHome.tsx`)
1. **KPI Scorecard (Top Row):** - 4 High-contrast cards: "Today's Visitors", "Active Book Loans", "Overdue Books", "Unpaid Penalties".
   - Fetch this data aggregately using `useQuery` from Supabase (`library_logs` and `book_loans`).
2. **Visual Hierarchy (Middle Row):**
   - **Left Column (Alerts):** A list of the top 5 most overdue books that require immediate librarian intervention. Use red/orange text to indicate urgency.
   - **Right Column (Live Feed):** A list of the 5 most recent QR code scans (Time-In) from the `library_logs` table.

## Execution Rules (Self-Annealing)
* Follow the CCC Purple (`#652D90`) branding for primary container borders or headers.
* Ensure loading skeletons are displayed while the Supabase aggregate queries run.