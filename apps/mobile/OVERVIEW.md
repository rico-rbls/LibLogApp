# LibLog — System Overview

> **Version:** 1.2  
> **Last Updated:** 2026-03-18  
> **Platform:** Mobile-first Web Application (max-width 430px)  
> **Framework:** Next.js 16 App Router + TypeScript 5

---

## Table of Contents

1. [What is LibLog?](#1-what-is-liblog)
2. [System Architecture](#2-system-architecture)
3. [Core Capabilities](#3-core-capabilities)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [Screen Map & Navigation Flow](#5-screen-map--navigation-flow)
6. [Data Layer](#6-data-layer)
7. [API Layer](#7-api-layer)
8. [State Management](#8-state-management)
9. [Design System Summary](#9-design-system-summary)
10. [Current Design Principles](#10-current-design-principles)
11. [Technology Stack](#11-technology-stack)
12. [Project Structure](#12-project-structure)
13. [Test Accounts & Seed Data](#13-test-accounts--seed-data)
14. [Known Limitations & Future Roadmap](#14-known-limitations--future-roadmap)

---

## 1. What is LibLog?

LibLog is a **Digital Library Logbook Management System** built for university libraries. It provides a phone-sized, app-like experience that enables students, faculty, and visitors to:

- **Browse** the library catalog and search for books, research papers, and magazines
- **Borrow and return** resources with role-based limits and overdue fine tracking
- **Track attendance** via QR code scanning with calendar heat map visualization
- **Manage reservations** for unavailable resources with status tracking
- **Receive notifications** for due dates, reservations, and announcements
- **Rate and review** resources with a 5-star rating system
- **Customize preferences** including dark mode, notification settings, and reading goals
- **View library announcements** with auto-rotating carousel

The system is designed to replicate a native mobile app experience within a web browser, using a 430px max-width container with a sticky bottom navigation bar, smooth Framer Motion animations, and a carefully crafted purple-themed design system.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Next.js App (430px container)         │  │
│  │                                                    │  │
│  │  ┌─────────────┐  ┌────────────┐  ┌────────────┐ │  │
│  │  │   Screens    │  │  Zustand   │  │  Framer    │ │  │
│  │  │  (14 total)  │  │   Store    │  │  Motion    │ │  │
│  │  │              │  │ (persist)  │  │ (animate)  │ │  │
│  │  └──────┬───────┘  └─────┬──────┘  └────────────┘ │  │
│  │         │                │                         │  │
│  │         └───────┬────────┘                         │  │
│  │                 │ fetch()                          │  │
│  └─────────────────┼──────────────────────────────────┘  │
│                    │                                     │
│  ┌─────────────────▼──────────────────────────────────┐  │
│  │          Next.js API Routes (17 endpoints)          │  │
│  │  /api/auth/*  /api/resources/*  /api/borrow/*      │  │
│  │  /api/reservations/*  /api/notifications/*          │  │
│  │  /api/attendance/*  /api/reviews/*  /api/settings   │  │
│  │  /api/announcements                                 │  │
│  └─────────────────┬──────────────────────────────────┘  │
│                    │                                     │
│  ┌─────────────────▼──────────────────────────────────┐  │
│  │              Prisma ORM (SQLite)                    │  │
│  │         9 Models / 5 Relations                      │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **Single-page app within Next.js** | Screen navigation is managed by Zustand state (not URL routing) for a native mobile app feel |
| **SQLite database** | Lightweight, file-based, zero-config — ideal for a library management system at a single university |
| **Client-side session** | No server sessions; Zustand + localStorage for auth state. App always starts at login on open |
| **API routes** | RESTful backend within Next.js — no separate server needed |
| **Class-based dark mode** | `next-themes` with `.dark` class toggling for instant theme switching |
| **Zustand over Context** | Simpler API, built-in persistence middleware, no provider nesting |

---

## 3. Core Capabilities

### 3.1 Authentication & Onboarding

- **5-step registration wizard**: Role selection → Personal info → Academic info → Account setup → Notification preferences
- **Login**: Email + password (SHA-256 hashed), demo account quick-fill button
- **Session**: Client-side only. `currentScreen` and `isAuthenticated` are NOT persisted — users always start at the login screen on app open
- **Password management**: Change password modal with strength meter, show/hide toggles, and match validation

### 3.2 Resource Catalog

- **17 seeded resources**: 10 books, 4 research papers, 3 magazines
- **Search**: Real-time with 300ms debounce, category filters (All/Book/Research/Magazine), popular search tags
- **Book detail**: Full metadata, availability status, ratings & reviews, borrow/reserve actions, share functionality, favorite toggle
- **AI-generated covers**: 10 book covers in `/public/covers/` with fuzzy title matching via `covers.ts`

### 3.3 Borrowing System

- **Role-based limits**: Students (3 books, 14 days), Faculty (10 books, 30 days), Visitors (1 book, 7 days)
- **Overdue fine tracking**: ₱5.00/day fine rate, per-book fine calculation, total fines summary card, due-soon warnings (1-3 days)
- **Return flow**: One-click return with confetti celebration animation, automatic available copy increment
- **Active/History tabs**: Separate views with color-coded accent borders (red=overdue, amber=due soon, purple=normal)

### 3.4 Attendance Tracking

- **QR code scanning**: Simulated scanner with Attendance Check-in and Book Checkout modes
- **Time-in/Time-out**: API calculates duration automatically
- **Calendar heat map**: Monthly grid with purple-highlighted attended days, today indicator, visit counts
- **Summary statistics**: Total visits, total hours, current day streak

### 3.5 Reservations

- **Create**: Reserve unavailable resources with one-click
- **Status tracking**: Pending → Fulfilled → Cancelled lifecycle
- **Filter tabs**: All / Pending (with count) / Fulfilled
- **Actions**: Cancel pending reservations, borrow fulfilled ones

### 3.6 Notifications

- **Three types**: Due date reminders (orange), reservation alerts (purple), announcements (blue)
- **Filter tabs**: All / Unread (with count) / Mentions
- **Swipe-to-dismiss**: Drag threshold >100px, spring snap-back if under
- **Grouped display**: Today / Yesterday / This Week / Earlier

### 3.7 Reviews & Ratings

- **5-star rating system**: Tap to select, with distribution chart (5★→1★)
- **Write/Edit reviews**: Inline form with star selector, comment (200 char max), upsert logic (one review per user per resource)
- **Delete own reviews**: Trash button with loading state
- **Review cards**: Avatar initials, name, role badge (color-coded), date, comment

### 3.8 User Profile

- **Reading goals**: Circular SVG progress ring with adjustable targets (12/24/36/48 books/year)
- **Reading stats**: 7-month mini bar chart with animated height growth
- **Favorites system**: Heart toggle on books, dedicated favorites screen with list view and remove functionality
- **Edit profile**: Change name, program, department, year level (email and university ID are locked)

---

## 4. User Roles & Permissions

| Capability | Student | Faculty | Visitor |
|-----------|---------|---------|---------|
| Browse catalog | ✅ | ✅ | ✅ |
| Search resources | ✅ | ✅ | ✅ |
| Borrow books | ✅ (max 3) | ✅ (max 10) | ✅ (max 1) |
| Loan duration | 14 days | 30 days | 7 days |
| Reserve books | ✅ | ✅ | ✅ |
| QR attendance | ✅ | ✅ | ✅ |
| Write reviews | ✅ | ✅ | ✅ |
| Receive notifications | ✅ | ✅ | ✅ |
| Access onboarding | ✅ | ✅ | ✅ |

> **Note:** A `librarian` role exists in the database schema but is not currently used in the UI.

---

## 5. Screen Map & Navigation Flow

### Screen Inventory (14 screens)

```
┌─ Unauthenticated ──────────────────────────────┐
│                                                 │
│  OnboardingScreen ──── LoginScreen              │
│  (5-step wizard)      (email + password)        │
│                                                 │
└──────────────────┬──────────────────────────────┘
                   │ login success
                   ▼
┌─ Authenticated (Bottom Nav) ───────────────────┐
│                                                 │
│  ┌─ Tab: Home ──────────────────────────────┐   │
│  │  HomeScreen (Dashboard)                  │   │
│  │  ├→ NotificationsScreen (bell icon)      │   │
│  │  └→ SettingsScreen (gear icon)           │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
│  ┌─ Tab: Search ────────────────────────────┐   │
│  │  SearchScreen                            │   │
│  │  └→ BookDetailScreen (tap result)        │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
│  ┌─ Tab: Scan ──────────────────────────────┐   │
│  │  QRScanScreen (elevated center button)   │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
│  ┌─ Tab: Borrowed ──────────────────────────┐   │
│  │  BorrowedScreen (Active/History tabs)    │   │
│  │  └→ BookDetailScreen (tap book)          │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
│  ┌─ Tab: Profile ───────────────────────────┐   │
│  │  ProfileScreen                           │   │
│  │  ├→ SettingsScreen                       │   │
│  │  ├→ EditProfileScreen                    │   │
│  │  ├→ FavoritesScreen                      │   │
│  │  ├→ ReservationsScreen                   │   │
│  │  └→ AttendanceScreen                     │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
│  BookDetailScreen (accessible from Search,      │
│  Borrowed, Favorites, Reservations)             │
│  └→ has Borrow / Reserve / Favorite / Share     │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Bottom Navigation (5 tabs)

| Position | Tab | Icon | Screen | Special |
|----------|-----|------|--------|---------|
| 1 | Home | `Home` | home | — |
| 2 | Search | `Search` | search | — |
| 3 | **Scan** | `ScanLine` | qr-scan | Elevated center button (-mt-6), purple gradient circle |
| 4 | Borrowed | `BookOpen` | borrowed | Active borrows count badge |
| 5 | Profile | `User` | profile | — |

**Nav behavior:**
- Hidden on: `onboarding`, `login`, `qr-scan`
- Auto-hides on scroll down, reappears on scroll up
- Always sticks to bottom of viewport (`shrink-0`, absolute positioning)

---

## 6. Data Layer

### Database: SQLite via Prisma ORM

**9 Models:**

```
User ─────────┬── BorrowRecord[] ──── Resource
              ├── Attendance[]
              ├── Reservation[] ───── Resource
              ├── Notification[]
              └── Review[] ────────── Resource

Resource ─────┬── BorrowRecord[]
              ├── Reservation[]
              └── Review[]

LibrarySettings (singleton)
Announcement
```

### Key Relationships

| From | To | Type | Foreign Key |
|------|----|------|-------------|
| User | BorrowRecord | One-to-Many | `userId` |
| User | Attendance | One-to-Many | `userId` |
| User | Reservation | One-to-Many | `userId` |
| User | Notification | One-to-Many | `userId` |
| User | Review | One-to-Many | `userId` |
| Resource | BorrowRecord | One-to-Many | `resourceId` |
| Resource | Reservation | One-to-Many | `resourceId` |
| Resource | Review | One-to-Many | `resourceId` |

### Unique Constraints

- `User.email` — one account per email
- `User.universityId` — one account per university ID
- `Review.[userId, resourceId]` — one review per user per resource (upsert logic)

---

## 7. API Layer

### 17 API Endpoints

| Category | Method | Endpoint | Purpose |
|----------|--------|----------|---------|
| **Auth** | POST | `/api/auth/login` | Login (SHA-256 hash verification) |
| | POST | `/api/auth/register` | Register new user |
| | PUT | `/api/auth/update` | Update profile, preferences, or password |
| **Resources** | GET | `/api/resources` | List/search (category, subject, search, page, limit) |
| | GET | `/api/resources/[id]` | Get single resource with related records |
| **Borrowing** | GET | `/api/borrow` | List borrow records (userId, status) |
| | POST | `/api/borrow` | Borrow a book (validates availability + limits) |
| | POST | `/api/borrow/[id]/return` | Return a book (increments available copies) |
| **Reservations** | GET | `/api/reservations` | List reservations (userId) |
| | POST | `/api/reservations` | Create reservation |
| | DELETE | `/api/reservations/[id]` | Cancel (soft-delete: status → "cancelled") |
| **Notifications** | GET | `/api/notifications` | List notifications (userId) |
| | PUT | `/api/notifications/[id]/read` | Mark as read |
| **Attendance** | GET | `/api/attendance` | List records (userId, date) |
| | POST | `/api/attendance` | Record time-in or time-out |
| **Reviews** | GET | `/api/reviews` | Get reviews + stats (resourceId) |
| | POST | `/api/reviews` | Create or update review (upsert) |
| | DELETE | `/api/reviews/[id]` | Delete a review |
| **Settings** | GET | `/api/settings` | Get library settings |
| | PUT | `/api/settings` | Update library settings |
| **Announcements** | GET | `/api/announcements` | List active announcements |
| **Health** | GET | `/api/` | Health check |

### Key Business Logic

- **Borrowing**: Validates availability, enforces role-based max limits, calculates role-based due dates, uses Prisma transaction (create record + decrement available copies)
- **Returning**: Validates not already returned, calculates late status, uses Prisma transaction (update record + increment available copies)
- **Reviews**: Upsert pattern — one review per user per resource; returns aggregate stats (average rating, distribution)
- **Attendance**: Time-in creates new record, time-out finds today's open record and calculates duration
- **Reservations**: Prevents duplicate pending reservations for same user+resource

---

## 8. State Management

### Store: Zustand with `persist` middleware

**Storage key:** `liblog-store` (localStorage)

### What IS Persisted

| Field | Type | Description |
|-------|------|-------------|
| `user` | `UserState \| null` | Full user data (name, email, role, preferences) |
| `onboardingStep` | `number` | Current onboarding step (0–4) |
| `onboardingData` | `object` | Registration form data accumulator |
| `favorites` | `string[]` | Favorited resource IDs |

### What is NOT Persisted

| Field | Type | Why |
|-------|------|-----|
| `currentScreen` | `AppScreen` | Always resets to `'login'` on app open |
| `isAuthenticated` | `boolean` | Always resets to `false` on app open |
| `previousScreen` | `AppScreen \| null` | Navigation state, not needed across sessions |
| `selectedBookId` | `string \| null` | Transient selection |
| `searchQuery` | `string` | Transient search state |
| `searchCategory` | `string` | Transient filter |
| `unreadCount` | `number` | Should refresh from API |

### Rehydration Behavior

On app open, `onRehydrateStorage` always resets `isAuthenticated → false` and `currentScreen → 'login'`, ensuring users always start at the login screen even if they closed the app while authenticated.

### Available Actions

| Action | Description |
|--------|-------------|
| `setCurrentScreen(screen)` | Navigate to screen, saves previous for back-nav |
| `goBack()` | Navigate to previousScreen (or home as fallback) |
| `setUser(user)` | Set user data + isAuthenticated = true |
| `logout()` | Clear user, reset ALL state to defaults |
| `toggleFavorite(id)` | Add/remove from favorites array |
| `isFavorite(id)` | Check if resource ID is in favorites |

---

## 9. Design System Summary

### Color Palette

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| **Brand Primary** | `#652D90` (Lib Purple) | `#7B3FA8` (Lib Purple Light) |
| **Page Background** | `#f2f2fa` (Lavender-tinted gray) | `oklch(0.13 0.04 300)` (~`#110a1e`, dark purple) |
| **Card Background** | `#FFFFFF` | `oklch(0.18 0.05 300)` (dark purple surface) |
| **Bottom Nav** | `bg-card` with `shadow-sm` | `dark:bg-[#1a0e2e]/90` with `shadow-sm` |
| **Dark surfaces** | N/A | `dark:bg-white/5`, `dark:bg-white/10`, `dark:bg-white/15` |
| **Dark borders** | N/A | `dark:border-white/5`, `dark:border-white/10` |

### Shadow System (Current)

> **Major Design Principle:** Light mode is **FLAT** — no shadows. Dark mode uses shadows for depth.

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| All cards | **No shadow** | `dark:shadow-sm` |
| All buttons | **No shadow** | `dark:shadow-*` (varies) |
| All images | **No shadow** | `dark:shadow-*` (varies) |
| Modals | **No shadow** | `dark:shadow-2xl` |
| **BottomNav** | `shadow-sm` ✅ | `shadow-sm` ✅ |
| **QR scan button** | `shadow-*` ✅ | `shadow-*` ✅ |
| Mobile container | **No shadow** | `dark:shadow-xl` |

**CSS utility classes** (`.card-hover-effect`, `.hover-lift`, `.glass-card`, `.press-effect`) only apply `box-shadow` in the `.dark` context.

### Card Corner Radius

- **Section cards**: `rounded-3xl` (24px)
- **Inner card elements**: `rounded-2xl` (16px)
- **Icon containers**: `rounded-[22px]` (22px squircle)
- **Pills/badges**: `rounded-full`

### Home Screen Greeting

The greeting uses **split weight** styling:
- "Good afternoon," is **regular weight** (not bold)
- "Juan!" is **bold** (`font-bold`)
- Implemented as: `<h1 className="text-2xl tracking-tight">Good afternoon, <span className="font-bold">Juan!</span></h1>`

### Streak Display

- Orange pill card: `bg-orange-400 dark:bg-orange-500 rounded-full` with Flame icon and white bold text

### Typography

- **Font**: Geist Sans (system font fallback)
- **Headings**: 30px–14px scale (H1–H6)
- **Body**: 16px regular
- **Weights used**: Regular (400), Medium (500), Semibold (600), Bold (700)

### Dark Mode Implementation

- **Class-based toggle** via `next-themes`
- **Dark purple theme**: Uses `oklch` with hue 300 (purple) for all dark surfaces
- **Transparency system**: `dark:bg-white/5`, `/10`, `/15` over dark purple base instead of opaque gray
- **Toggle**: Available in Settings screen, persists across sessions

---

## 10. Current Design Principles

These are the key design decisions that shape the current system:

1. **Flat Light Mode**: No shadows on any content surface in light mode. Visual separation comes from the contrast between `#f2f2fa` page background and `#FFFFFF` card surfaces. Only BottomNav and QR scan button have shadows in both modes.

2. **Dark Purple Mode**: Not a simple dark gray — the dark mode uses a deep purple base (`#110a1e`) with transparency layers, creating a cohesive brand experience even in dark mode.

3. **Mobile-First, Single-Column**: The entire app is designed for a 430px max-width container. No responsive breakpoints for desktop layouts.

4. **Native App Feel**: Screen transitions (AnimatePresence), pull-to-refresh, swipe-to-dismiss, spring animations, and haptic-like press feedback replicate native mobile interactions.

5. **State-Driven Navigation**: No URL routing. Screen navigation is managed entirely through Zustand state, providing a native app-like flow where back navigation is tracked internally.

6. **Card-Based Layout**: All content sections are wrapped in `bg-card rounded-3xl dark:shadow-sm p-4` cards, providing consistent visual structure across all screens.

7. **Purple-Forward Branding**: The `#652D90` purple is used extensively — buttons, accents, gradients, shadows (in dark mode), and even dark mode surface tints all carry the brand color.

8. **Split-Weight Greeting**: The home screen greeting uses a regular-weight prefix ("Good afternoon,") with a bold name ("Juan!"), creating visual hierarchy without increasing font size.

9. **Lavender Background**: The `#f2f2fa` background provides a subtle purple warmth compared to pure white or gray, reinforcing the brand even on the page surface.

---

## 11. Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Framework** | Next.js (App Router) | 16 |
| **Language** | TypeScript | 5 |
| **Styling** | Tailwind CSS | 4 |
| **UI Components** | shadcn/ui (New York) | 40+ components |
| **Icons** | Lucide React | Latest |
| **Database** | SQLite via Prisma ORM | 6 |
| **State Management** | Zustand (persist middleware) | 5 |
| **Animations** | Framer Motion | 12 |
| **Theming** | next-themes (class-based) | Latest |
| **Forms** | react-hook-form + zod | Latest |
| **Charts** | Recharts | Latest |
| **Auth** | NextAuth.js v4 (available, not actively used) | v4 |
| **Image Processing** | Sharp | Latest |
| **Fonts** | Geist Sans + Geist Mono | Latest |
| **Password Hashing** | Web Crypto API (SHA-256) | Native |

---

## 12. Project Structure

```
src/
├── app/
│   ├── api/                    # 17 API route handlers
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   └── update/route.ts
│   │   ├── resources/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── borrow/
│   │   │   ├── route.ts
│   │   │   └── [id]/return/route.ts
│   │   ├── reservations/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── notifications/
│   │   │   ├── route.ts
│   │   │   └── [id]/read/route.ts
│   │   ├── attendance/route.ts
│   │   ├── reviews/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── settings/route.ts
│   │   ├── announcements/route.ts
│   │   └── route.ts            # Health check
│   ├── globals.css             # Theme variables, custom classes, animations
│   ├── layout.tsx              # Root layout (fonts, ThemeProvider, Toaster)
│   └── page.tsx                # Main entry (screen router + BottomNav)
│
├── components/
│   ├── layout/
│   │   └── BottomNav.tsx       # 5-tab bottom navigation
│   ├── screens/
│   │   ├── OnboardingScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── BookDetailScreen.tsx
│   │   ├── BorrowedScreen.tsx
│   │   ├── QRScanScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── NotificationsScreen.tsx
│   │   ├── AttendanceScreen.tsx
│   │   ├── FavoritesScreen.tsx
│   │   ├── ReservationsScreen.tsx
│   │   └── EditProfileScreen.tsx
│   └── ui/                     # shadcn/ui components (40+)
│
├── lib/
│   ├── store.ts                # Zustand store (state + actions)
│   ├── auth.ts                 # Password hashing, avatar initials, borrow rules
│   ├── covers.ts               # Book cover image mapping (12 titles)
│   ├── db.ts                   # Prisma client singleton
│   └── utils.ts                # cn() utility (clsx + twMerge)
│
prisma/
├── schema.prisma               # 9 database models
└── seed.ts                     # Test data (3 users, 17 resources, etc.)

public/
└── covers/                     # 10 AI-generated book cover images
```

---

## 13. Test Accounts & Seed Data

### Test Accounts

All accounts use the password: `password123`

| Role | Name | Email | University ID | Details |
|------|------|-------|---------------|---------|
| **Student** | Juan Dela Cruz | juan@university.edu | CS-2024-0001 | CS program, 3rd Year, streak=5 |
| **Faculty** | Maria Santos | maria@university.edu | FAC-2024-0001 | CS Department, streak=12 |
| **Visitor** | Alex Reyes | alex@university.edu | VIS-2024-0001 | — |

### Seed Data Summary

| Type | Count | Details |
|------|-------|---------|
| Users | 3 | Student, Faculty, Visitor |
| Resources | 17 | 10 books, 4 research, 3 magazines |
| Borrow Records | 5 | 2 active, 1 overdue (student), 2 returned |
| Notifications | 6 | Due soon, overdue, reservation, hours, confirmed, reminder |
| Announcements | 2 | Extended hours for finals, New AI/ML arrivals |
| Reservations | 1 | Student → Clean Code (pending) |
| Attendance | 2 | Today (time-in only), Yesterday (7 hours) |
| Reviews | 10 | Across 6 resources, ratings 2-5 |
| Book Covers | 10 | AI-generated PNG images in `/public/covers/` |

---

## 14. Known Limitations & Future Roadmap

### Current Limitations

1. **QR scanning is simulated** — no real camera integration; auto-simulates a scan after 2 seconds
2. **No real push notifications** — notifications are in-app only, fetched from the database
3. **Password hashing is SHA-256** — functional but not industry-standard (bcrypt/argon2 would be preferred for production)
4. **No server-side sessions** — auth is entirely client-side (Zustand + localStorage)
5. **No offline support** — requires network connection for all data
6. **No admin interface** — librarian role exists but no admin screens
7. **Book covers** — only 10 of 17 resources have AI-generated covers; the rest use gradient placeholders
8. **Attendance mock fallback** — AttendanceScreen falls back to mock data when API returns empty
9. **No image upload** — profile avatars are auto-generated initials only
10. **Single-language** — English only, no i18n support

### Priority Roadmap

| Priority | Feature | Description |
|----------|---------|-------------|
| 🔴 High | Real QR scanning | Integrate camera API for actual QR code reading |
| 🔴 High | Admin dashboard | Librarian screens for managing resources, users, and announcements |
| 🟡 Medium | Password security | Migrate from SHA-256 to bcrypt/argon2 |
| 🟡 Medium | Image upload | Allow profile photo upload and custom book cover management |
| 🟡 Medium | Search autocomplete | Add search suggestions dropdown as user types |
| 🟡 Medium | Offline caching | Service worker with offline-first data access |
| 🟢 Low | Push notifications | Web Push API integration for real-time alerts |
| 🟢 Low | Multi-language | i18n support for Filipino and other languages |
| 🟢 Low | Analytics dashboard | Usage statistics and reporting for librarians |
| 🟢 Low | Accessibility audit | Full WCAG AA compliance review and fixes |

---

## Companion Documents

| Document | Purpose | Location |
|----------|---------|----------|
| **FEATURES.md** | Granular feature inventory (all screens, APIs, models, animations) | `/FEATURES.md` |
| **BRANDING.md** | Complete design system guide (colors, spacing, typography, shadows, components) | `/BRANDING.md` |
| **worklog.md** | Development history with task IDs, agent logs, and stage summaries | `/worklog.md` |

---

> **This document provides the high-level system overview of LibLog.** For detailed feature specifications, see FEATURES.md. For design system rules, see BRANDING.md. For development history, see worklog.md.
