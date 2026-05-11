# Directive: Desktop Phase 4 - Administrative Reporting (CHED Module)

## Objective
Develop the export engine required for institutional compliance. The librarian must be able to generate usage metrics based on the collected log data.

## Context & Tech Stack
* **Framework:** React + TypeScript
* **Export Libraries:** `json2csv` (or standard Blob/CSV generation) and `jspdf` / `jspdf-autotable`.

## Component Requirements
1. **`ReportGenerator.tsx`:**
   - Provide Date Picker inputs (Start Date, End Date).
   - Provide a Dropdown filter for `patron_type` (Student, Faculty, Visitor) or `program` (BSPA, Midwifery).
   - Query the `library_logs` and `patrons` tables based on these filters.
   - Implement an "Export to CSV" button.
   - Implement an "Export to PDF" button that generates a formatted report complete with a document title, generation date, and tabular log data.

## Execution Rules (Self-Annealing)
* The UI must remain responsive during data processing. 
* Ensure the PDF output looks professional, as it mimics official CCC documentation.
* Handle empty datasets properly: disable the export buttons and show a "No records found for this date range" message if the query returns empty.