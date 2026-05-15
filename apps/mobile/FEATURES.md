# LibLog Mobile — Feature Documentation

> **Institution:** Calauan Community College (CCC)  
> **Platform:** Expo + React Native (NativeWind v4)  
> **Role:** Data-collection client subordinate to the Desktop_App (SSoT)

---

## Feature Parity with Desktop_App

The Mobile_App operates as the **data-collection client** for the LibLog system. All administrative logic, penalty calculations, and inventory management reside in the Desktop_App, which serves as the **administrative engine**. Each mobile feature maps directly to a Desktop_App module, and data flows through the shared Supabase backend.

| Mobile Feature           | Desktop_Counterpart          | Direction of Data Flow | Notes                                                                                                              |
| ------------------------ | ---------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| QR Scanner               | Live Monitor                 | Mobile → Desktop       | Scans patron QR codes for attendance; events appear on the Desktop Live Monitor in real time via Supabase Realtime |
| Penalty View (Read-Only) | Circulation Engine           | Desktop → Mobile       | Payment processing remains on the Desktop_App; mobile displays accrued fines only                                  |
| Catalog                  | Books Manager                | Desktop → Mobile       | Mobile reads the book inventory managed exclusively by Desktop librarians                                          |
| Patron Login             | Authentication Engine        | Bidirectional          | Credentials validated via shared Supabase Auth; session tokens flow both directions                                |
| Reservations             | Circulation Engine           | Mobile → Desktop       | Patrons submit reservation requests from mobile; fulfillment is processed on the Desktop                           |
| Attendance History       | Live Monitor / `/attendance` | Desktop → Mobile       | Historical attendance records written by the Desktop are read by the mobile client                                 |

---

## Screen Inventory

The following screens are implemented as Expo Router file-based routes under `apps/mobile/app/`:

- **Home** — Personalized dashboard with library status, current loans, and recommendations
- **Catalog (Search)** — Browse and search the book inventory
- **QR Scanner** — Scan patron QR codes for attendance check-in and book checkout
- **My Loans (Borrowed)** — View active loans, due dates, and return history
- **Profile** — User information, reading goals, and attendance statistics
- **Reservations** — Submit and track book reservation requests
- **Attendance** — Calendar heatmap of library visit history
- **Notifications** — Due-date reminders and reservation alerts
- **Settings** — App preferences and account management

---

## Data Flow Summary

All data flows between the Mobile_App and the Desktop_App pass through the shared Supabase backend (PostgreSQL + Auth + Realtime). The Mobile_App never communicates directly with the Desktop_App process. The direction labels in the feature table indicate which app originates or consumes the data:

- **Mobile → Desktop** — The mobile client writes data that the Desktop reads or processes
- **Desktop → Mobile** — The Desktop writes data that the mobile client reads
- **Bidirectional** — Both apps read and write to the same shared resource
