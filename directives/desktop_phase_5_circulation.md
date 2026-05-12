# Directive: Desktop Phase 5 - Book Circulation Engine

## Objective
Implement the book borrowing system for the Librarian Desktop Dashboard, strictly adhering to the CCC Librarian's manual constraints: 3-day max borrow time, no reservations, ₱5 penalty for overdue returns, and a mechanism to mark books as 'donated'.

## Context & Tech Stack
* **Framework:** Vite + React + TypeScript + TailwindCSS
* **Backend:** `@supabase/supabase-js`
* **Schema Additions:** The `book_loans` table handles the transactions. The `books` table now has a `status` column.

## Component Requirements
1. **`CirculationManager.tsx`:**
   - A split interface: Left side for "Issue Book" (Select Patron, Select Book -> Create `book_loans` record). 
   - Ensure the "No Reservation" rule: The "Issue" button must be disabled if `available_copies === 0`.
   - Right side for "Return Book": A table of active loans. Clicking "Return" updates `returned_at` and restores `available_copies` to the book.
2. **`OverdueDashboard.tsx`:**
   - A table specifically querying `book_loans` where `due_date < NOW()` and `status = 'active'`.
   - Implement a dynamic calculation column: `(Current Date - Due Date in days) * 5 PHP`.
   - Include a "Settle Penalty & Return" button.
3. **Book Status Update:**
   - Update our existing `BooksManager.tsx` to allow the librarian to change a book's status from 'active' to 'donated'.

## Execution Rules (Self-Annealing)
* Financial calculations must be strict. Use `date-fns` for accurate day-difference calculations.
* Use CCC Purple (`#652D90`) for primary actions.