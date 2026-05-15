# LibLog Mobile — System Overview

> **Institution:** Calauan Community College (CCC)  
> **Lead Programmer:** Ric Robles  
> **Platform:** Expo plus React Native  
> **Role:** Data-collection client for the LibLog ecosystem  
> **Monorepo Position:** `apps/mobile` (consumed via the `apps/*` workspace glob)

---

## Architectural Stance

The Desktop_App is the **Single Source of Truth (SSoT)** for all backend logic, administrative workflows, and data authority within the LibLog system. The Mobile_App is merely a React Native data-collection client. No backend logic is permitted in the mobile app.

This architectural mandate is defined in [`.kiro/steering/desktop_architecture_ssot.md`](../../.kiro/steering/desktop_architecture_ssot.md).

The Mobile_App:

- Consumes the same Supabase backend as the Desktop_App
- Contains zero server-side code, zero API route handlers, and zero ORM logic
- Delegates all administrative operations (book management, patron CRUD, report generation, penalty settlement) to the Desktop_App
- Operates exclusively as a thin client for patron-facing data collection (attendance, borrowing requests, catalog browsing)

---

## Platform & Backend

| Aspect         | Value                                                       |
| -------------- | ----------------------------------------------------------- |
| **Platform**   | Expo plus React Native                                      |
| **Backend**    | Supabase (PostgreSQL, Auth, Realtime) — shared with Desktop |
| **Role**       | data-collection client                                      |
| **Navigation** | Expo Router (file-based routing)                            |
| **Styling**    | NativeWind v4 (Tailwind CSS for React Native)               |
| **State**      | Zustand (mirrors Desktop pattern)                           |

The Mobile_App connects to the identical Supabase project used by the Desktop_App. Authentication tokens, database tables, and Realtime subscriptions are shared across both clients. The mobile client uses `@supabase/supabase-js` exclusively — no custom backend, no middleware, no server-side rendering.

---

## Monorepo Position

```
LibLogApp/                          ← Workspace Root (package.json)
├── apps/
│   ├── desktop/liblog-desktop/     ← Desktop_App (Vite + React 19 + Tailwind v4)
│   └── mobile/                     ← Mobile_App (this workspace)
├── packages/                       ← Shared packages (future)
└── package.json                    ← workspaces: ["apps/*", "packages/*"]
```

The Mobile_App lives at `apps/mobile` and is discovered by the root workspace through the `apps/*` glob pattern. This ensures both Desktop and Mobile workspaces are resolved under a single `npm install` with hoisted shared dependencies.

---

## Tech Stack

| Category             | Technology                      | Notes                                |
| -------------------- | ------------------------------- | ------------------------------------ |
| **Runtime**          | Expo (~52.x)                    | Managed workflow                     |
| **UI Framework**     | React Native (~0.76.x)          | Cross-platform native views          |
| **Navigation**       | Expo Router (~4.x)              | File-based routing under `app/`      |
| **Styling**          | NativeWind v4 + Tailwind CSS v4 | Tailwind classes in React Native     |
| **Backend Client**   | @supabase/supabase-js (^2.x)    | Same instance as Desktop             |
| **State Management** | Zustand (^5.x)                  | Auth store, client state             |
| **Icons**            | lucide-react-native             | Parity with Desktop icon set         |
| **Forms**            | react-hook-form + zod           | Validation and form state            |
| **Data Fetching**    | @tanstack/react-query (^5.x)    | Server cache with offline resilience |
| **Animations**       | react-native-reanimated         | Native-thread animations             |
| **Date Utilities**   | date-fns                        | Shared with Desktop                  |

---

## Screen Inventory

The Mobile_App exposes patron-facing screens only. All administrative screens (Books Manager, Patron Manager, Report Generator, Overdue Dashboard, Circulation Engine) remain exclusive to the Desktop_App.

### Tab Navigation (5 tabs)

| Tab      | Screen              | Route                     | Purpose                                             |
| -------- | ------------------- | ------------------------- | --------------------------------------------------- |
| Home     | Home Dashboard      | `app/(tabs)/index.tsx`    | Greeting, stats, quick actions, announcements       |
| Search   | Catalog / Search    | `app/(tabs)/search.tsx`   | Browse and search the book catalog                  |
| Scan     | QR Scanner          | `app/(tabs)/scan.tsx`     | Attendance check-in and book checkout via QR        |
| Borrowed | My Loans / Borrowed | `app/(tabs)/borrowed.tsx` | Active loans, history, due dates, fines (read-only) |
| Profile  | Profile             | `app/(tabs)/profile.tsx`  | User info, reading goals, favorites, settings       |

### Supporting Screens

| Screen             | Purpose                                             |
| ------------------ | --------------------------------------------------- |
| Book Detail        | Full metadata, availability, borrow/reserve actions |
| Reservations       | View and cancel pending reservations                |
| Attendance History | Calendar heat map, visit stats                      |
| Favorites          | Saved books list                                    |
| Settings           | Theme toggle, notification preferences              |
| Notifications      | Due date reminders, reservation alerts              |

---

## Data Flow

All data flows through Supabase. The Mobile_App never processes, transforms, or stores authoritative data locally beyond client-side cache.

```
Mobile_App (React Native)
    │
    │  @supabase/supabase-js
    │  (read: catalog, loans, attendance)
    │  (write: check-in, borrow request, reservation)
    ▼
Supabase (PostgreSQL + Auth + Realtime)
    ▲
    │  @supabase/supabase-js
    │  (full CRUD, admin operations, reports)
    │
Desktop_App (Vite + React 19)
```

---

## Branding Alignment

The Mobile_App implements the same visual identity as the Desktop_App, governed by `.kiro/steering/branding.md`:

- **Primary color:** Lib Purple `#652D90` with full 10-shade palette
- **Page background:** `#f2f2fa` (light) / `#110a1e` (dark)
- **Card radius:** `rounded-3xl` (24px)
- **Shadow system:** Flat in light mode; `dark:shadow-sm` in dark mode
- **Typography:** System fonts with the same weight scale

---

## What This App Is NOT

The Mobile_App is a data-collection client. It does not and will never contain:

- Server-side route handlers or API endpoints
- Database ORM layers or direct database connections
- Authentication server logic (uses Supabase Auth client SDK only)
- Administrative workflows (book CRUD, patron management, penalty settlement, report generation)
- Server-side rendering or static site generation

All such capabilities belong exclusively to the Desktop_App as defined by the SSoT.

---

> **This document defines the Mobile_App's role within the LibLog monorepo.** For the authoritative system architecture, see the Desktop_App documentation and `.kiro/steering/desktop_architecture_ssot.md`.
