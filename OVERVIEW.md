# LibLog: System Overview & Architecture
**Institution:** Calauan Community College (CCC)
**Lead Programmer:** Ric Robles
**Target Milestone:** May 18 MVP Launch

## 🏛️ System Architecture (3-Layer)
We adhere to a robust 3-layer architecture to ensure reliability and maintainability:
1. **Layer 1: Directive (Intent)** — SOPs in `directives/` defining logic and edge cases.
2. **Layer 2: Orchestration (AI)** — Intelligent routing and decision-making (Antigravity).
3. **Layer 3: Execution (Deterministic)** — TypeScript components and Supabase services.

## 💻 Tech Stack
*   **Desktop Dashboard:** React 19 + Vite + TypeScript.
*   **Styling:** Vanilla CSS + CCC Branding (Purple: `#652D90`).
*   **State Management:** Zustand (Auth/Global), TanStack React Query (Server Cache).
*   **Backend:** Supabase (Auth, PostgreSQL, Realtime).
*   **Reporting:** jsPDF + jspdf-autotable (PDF), Native Blob (CSV).

## 📊 Database Schema (Supabase)
*   **`programs`**: Academic tracks (BSPA, MID).
*   **`patrons`**: Unified table for Students, Faculty, and Visitors (Linked to `auth.users`).
*   **`books`**: Inventory management with ISBN and availability tracking.
*   **`library_logs`**: Core transactional table for attendance tracking.
*   **`book_loans`**: Circulation tracking (3-day borrow period, overdue penalties).
*   **Functions**: `close_stale_library_sessions` (Automated 5PM checkout).

## 🛣️ Routing Architecture (Phase 8 IA)
*   **`/`**: Dashboard Overview (KPIs, Live Scan Feed).
*   **`/catalog`**: Book Inventory (Dual-view Grid/Table).
*   **`/patrons`**: Patron Management (Unified ID search).
*   **`/circulation`**: Issue/Return transaction engine.
*   **`/attendance`**: Historical Logbook and QR entry monitor.
*   **`/reports`**: Administrative exports (CSV/PDF).
*   **`/overdue`**: Penalty tracking and settlement dashboard.

## 🚀 Delivered Modules
*   **Phase 1: Authentication Engine** — Role-based gate with session persistence.
*   **Phase 2: CRUD Engine** — High-performance "Search-as-you-type" for 5,000+ books and patron management with relational joins.
*   **Phase 3: Live Monitor** — Real-time sensor array using Supabase Realtime subscriptions with pulse animations for new scans.
*   **Phase 4: CHED Reporting** — Administrative export module for CSV and professional PDF reports.
*   **Phase 5: Circulation Engine** — Book lending lifecycle (3-day loans, ₱5/day overdue penalties, return processing, donated inventory workflow).
*   **Phase 6: Dashboard BI Hub** — Implemented KPI scorecards and real-time alerts.

## 🖥️ Desktop Implementation Status
*   **Auth Gate:** Implemented — email/password login, session persistence via Supabase.
*   **Patron Manager:** Implemented — CRUD with Unified ID (7-char short ID), program joins.
*   **Inventory:** Dual-view Catalog (Grid/Table) with interactive Edit Modal and strict component isolation.
*   **Live Monitor:** Implemented — Supabase Realtime subscriptions, pulse animation on new scans.
*   **Report Generator:** Implemented — CSV + PDF exports with CHED-compliant formatting.
*   **Circulation Manager:** Implemented — issue/return engine with 3-day borrow period.
*   **Overdue Dashboard:** Implemented — penalty tracker with date-fns calculation (₱5/day).
*   **Dashboard BI Hub:** Implemented KPI scorecards and real-time alerts.
*   **Information Architecture:** Implemented strict route isolation separating Entities (Catalog, Patrons) from Transactions (Circulation, Attendance).

## 🛠️ Development Mandates
*   **Robles Git Loop:** `git add .` -> `commit` -> `push` for every logical milestone.
*   **Self-Annealing:** Automatic error correction and schema verification before implementation.
*   **Offline Resilience:** Aggressive caching via React Query to handle unstable campus networks.
*   **Veracity:** TOTP-based QR codes (30s refresh) to ensure attendance physical presence.

---
*Last Updated: 2026-05-12 by Antigravity*