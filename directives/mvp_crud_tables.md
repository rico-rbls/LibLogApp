# Directive: MVP CRUD Tables for LibLog Desktop

## Objective
Implement the Minimum Viable Product (MVP) data management tables for the Librarian Desktop Dashboard. The system requires two primary interfaces: Books Inventory Management and Logbook Attendance Tracking.

## Context & Tech Stack
* **Framework:** Vite + React + TypeScript
* **Styling:** Tailwind CSS (Strictly use `#652D90` for primary actions/active states)
* **Data Fetching/Caching:** `@tanstack/react-query`
* **Database Client:** `@supabase/supabase-js` (via `src/services/supabase.ts`)
* **Icons:** `lucide-react`

## Database Schema Context
1. **`books` table:** `id`, `title`, `isbn`, `author`, `category`, `total_copies`, `available_copies`.
2. **`patrons` table:** Replaced the old 'students' table. Contains `id`, `full_name`, `id_number`, `patron_type` ('student', 'faculty', 'visitor').
3. **`library_logs` table:** Contains `id`, `patron_id` (FK to patrons.id), `time_in`, `time_out`, `status`.

## Component Requirements
1. **`BooksManager.tsx`:**
   - Display a data table of all books.
   - Include an "Add Book" form/modal (Title, Author, ISBN, Copies).
   - Implement `useMutation` for creating and deleting books. Invalidate the query cache on success.
2. **`LogbookManager.tsx`:**
   - Display real-time attendance.
   - Must perform a Supabase relational query: `supabase.from('library_logs').select('*, patrons(full_name, patron_type)')`.
   - Show columns: Full Name, Role (Student/Faculty/Visitor), Time-In, Status.
   - Include a "Force Time-Out" button for active logs.

## Edge Cases & Strict Rules (Self-Annealing)
* **No Implicit Any:** Define strict TypeScript interfaces (`Book`, `LogEntry`, `Patron`) before writing the components.
* **Loading States:** UI must show skeleton loaders or spinners while React Query fetches data.
* **Env Variables:** Never hardcode keys. The client is already setup to use `import.meta.env`.