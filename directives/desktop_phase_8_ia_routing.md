# Directive: Desktop Phase 8 - Information Architecture & Strict Routing

## Objective
Eradicate component bleeding by strictly enforcing React Router paths. Implement a professional Information Architecture (IA) for the Sidebar Navigation, separating core entities from transactional logs. Fix page titles to dynamically reflect the current route.

## Context & Tech Stack
* **Framework:** Vite + React Router DOM + TypeScript
* **Icons:** `lucide-react` (LayoutDashboard, Library, Users, ArrowRightLeft, Clock, FileText)

## Bug Fix Requirements
1. **The "Books" Bleed:** `src/pages/Books.tsx` (or similar parent) is currently rendering both Books and Attendance. Strip out the Attendance component completely. The Books page must ONLY render the Catalog/Inventory.
2. **The Generic Title:** Remove the hardcoded `<h1>Librarian Dashboard</h1>` from individual pages. Implement a dynamic page header layout.

## New IA Requirements (SidebarLayout.tsx & App.tsx)
Reconfigure the Router and Sidebar to strictly match these paths:
* `/` -> `<DashboardHome />` (Overview / KPIs)
* `/catalog` -> `<BooksManager />` (Books Inventory)
* `/patrons` -> `<PatronManager />` (User Profiles)
* `/circulation` -> `<CirculationManager />` (Borrow/Return)
* `/attendance` -> `<LogbookManager />` (QR Scans / Live View)
* `/reports` -> `<ReportGenerator />` (PDF Exports)

## Execution Rules (Self-Annealing)
* Ensure the sidebar highlights the active route using CCC Purple (`#652D90`).
* Check all imports in `App.tsx` to ensure no components are missing or improperly nested.