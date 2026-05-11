# Directive: Desktop Phase 3 - Real-Time Attendance Monitor

## Objective
Construct the "Live View" dashboard for the Librarian. This module acts as the sensor array, displaying real-time entries from the mobile QR scanner.

## Context & Tech Stack
* **Framework:** React + TypeScript
* **Data Fetching:** `@tanstack/react-query` (Initial Load) + Supabase Realtime API (Subscriptions)

## Component Requirements
1. **`LiveMonitor.tsx`:**
   - Fetch the logs for `CURRENT_DATE` from the `library_logs` table, joining with the `patrons` table to display names.
   - Implement Supabase Realtime `on('postgres_changes')` to listen for new inserts into `library_logs`. When a student scans in via mobile, it must appear on this desktop screen instantly.
   - Display active logs in a grid or highlighted table.
2. **"Manual Time-Out" Action:**
   - Add a button next to active sessions.
   - When clicked, execute a Supabase `UPDATE` to set the `time_out` timestamp and change status to 'completed'.

## Execution Rules (Self-Annealing)
* Real-time listeners can cause memory leaks if not cleaned up. Ensure the Supabase channel is properly unsubscribed in the `useEffect` cleanup function.
* Clearly distinguish between "Active" and "Completed" logs visually (e.g., green indicator for active, gray for completed).