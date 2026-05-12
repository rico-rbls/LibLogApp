# Directive: Desktop Phase 7 - Books Catalog & Component Isolation

## Objective
Refactor the Books Management module to strictly isolate it from the Attendance module. Implement a dual-view UI (Table/Grid Catalog) and an interactive Edit Modal for updating book records.

## Context & Tech Stack
* **Framework:** Vite + React + TypeScript + TailwindCSS
* **State Management:** React Query for data, `useState` for UI toggles.
* **Design Token:** CCC Purple (`#652D90`).

## Bug Fixes Required
1. **Component Bleeding:** Inspect `src/components/BooksManager.tsx` and `src/App.tsx`. Strip out any code rendering the `LogbookManager` or attendance tables inside the Books view. 
2. **Title Correction:** The header for the Books page MUST read "Books Catalog & Inventory", not "Librarian Dashboard".

## New Feature Requirements
1. **View Toggle (List vs. Grid):**
   - Add a toggle button group (using `lucide-react` icons like `List` and `Grid`) at the top of the `BooksManager`.
   - **Table View:** The existing tabular layout.
   - **Catalog View:** A responsive CSS Grid (`grid-cols-1 md:grid-cols-3 lg:grid-cols-4`) displaying books as cards. Show a placeholder cover icon, Title, Author, and a bold indicator of `available_copies`.
2. **`BookEditModal.tsx`:**
   - Create a separate component for the Edit Card/Modal.
   - Clicking a book in *either* view opens this modal.
   - Must contain a form pre-populated with the book's current details (Title, Author, ISBN, Total Copies, and Status: Active/Lost/Donated).
   - Use `useMutation` to push `UPDATE` commands to Supabase. Call `queryClient.invalidateQueries({ queryKey: ['books'] })` on success to seamlessly refresh the UI.

## Execution Rules (Self-Annealing)
* Ensure z-index values on the Edit Modal are high enough to overlay the layout (`z-50`).
* Use a semi-transparent backdrop for the modal overlay.