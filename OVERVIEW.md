# LibLog: System Overview & Architecture
**Institution:** Calauan Community College (CCC)
**Lead Programmer:** Ric Robles
**Target Completion:** May 18 (80% MVP)

## Core Stack
* **Frontend:** React Native (Expo Router) + TypeScript
* **State Management:** Zustand (Client), React Query (Server)
* **Backend:** Supabase (PostgreSQL)
* **Branding:** CCC Purple (`#652D90`)

## Active Schema (3NF)
1. `programs`: BSPA and Midwifery.
2. `students`: UUID mapped to Auth, with Program FK.
3. `library_logs`: The core transaction table with Time-In/Time-Out.
4. `admin_actions`: The Librarian's audit trail.

## Development Mandates
* **Strict Git Workflow:** Publish -> Add -> Commit -> Push.
* **Offline Resilience:** React Query caching is required for unstable networks.
* **Veracity:** QR codes use TOTP (30-second refresh) to prevent proxy logs.