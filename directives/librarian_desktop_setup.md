# Directive: Librarian Desktop Dashboard Scaffold

## Objective
Initialize a React-based desktop environment (Vite + React + TypeScript) for the LibLog Librarian Dashboard. It must connect to our existing Supabase PostgreSQL database and use the CCC institutional color (#652D90).

## Context & Constraints
* **Institution:** Calauan Community College (CCC)
* **Users:** 1 Admin (Librarian) monitoring 300-500 students.
* **Database:** Supabase (Already initialized with `programs`, `students`, `library_logs`, `admin_actions`).
* **Design Token:** Primary color MUST be `#652D90` (CCC Purple).
* **Architecture:** Must use React Query for data fetching and TailwindCSS for styling.

## Execution Steps (For Orchestrator)
1. Initialize a new Vite React TypeScript project in a separate directory called `liblog-desktop`.
2. Install dependencies: `lucide-react`, `tailwindcss`, `@supabase/supabase-js`, `@tanstack/react-query`, `zustand`, `date-fns`.
3. Scaffold a standard Admin Sidebar layout (Dashboard, Student Logs, Book Inventory, Reports).
4. Create the `supabaseClient.ts` connection file.
5. Create a `theme.css` or Tailwind config locking in `#652D90` as `ccc-purple`.

## Outputs
* A running local web application that serves as the foundation for our Electron/Desktop wrapper.
* Code must be highly modular and commented.