# Directive: Desktop Phase 2 - The Patron & Book Engine (CRUD)

## Objective
Build the Core CRUD (Create, Read, Update, Delete) interfaces for the system's primary entities: `patrons` and `books`. 

## Context & Tech Stack
* **Framework:** React + TypeScript + TailwindCSS
* **Data Fetching:** `@tanstack/react-query`
* **Icons:** `lucide-react`

## Component Requirements
1. **`PatronManager.tsx`:**
   - Fetch data from the `patrons` table.
   - Display a data-dense table with columns: ID Number, Full Name, Patron Type (Student/Faculty/Visitor), and Program.
   - Include a search bar to filter patrons by Name or ID.
2. **`BooksManager.tsx`:**
   - Fetch data from the `books` table.
   - Display columns: Title, Author, ISBN, Total Copies, Available Copies.
   - Create a form modal to "Add New Book".
   - Use `useMutation` to handle inserts. **Must call `queryClient.invalidateQueries` on success** to update the table without a browser refresh.

## Execution Rules (Self-Annealing)
* Handle loading and empty states elegantly. If React Query is `isLoading`, display a skeleton or spinner.
* Enforce Tailwind utility classes for strict tabular alignment. Use `#652D90` for all primary action buttons (Add, Save, Edit).