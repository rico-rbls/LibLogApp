# LibLog — Digital Library Logbook Management System

> **Feature Documentation** — Last updated: 2026-03-06
> This document is the single source of truth for all features. Update it whenever the system is modified.

---

## Table of Contents

1. [App Overview](#1-app-overview)
2. [Screens & UI Features](#2-screens--ui-features)
3. [API Endpoints](#3-api-endpoints)
4. [Database Models](#4-database-models)
5. [State Management](#5-state-management)
6. [Authentication & Security](#6-authentication--security)
7. [Theme & Design System](#7-theme--design-system)
8. [Animations & Micro-Interactions](#8-animations--micro-interactions)
9. [Navigation & Layout](#9-navigation--layout)
10. [Utility Libraries](#10-utility-libraries)
11. [Seed / Test Data](#11-seed--test-data)
12. [Technology Stack](#12-technology-stack)
13. [Branding & Design System Guide](#13-branding--design-system-guide)

---

## 1. App Overview

LibLog is a **mobile-first** Digital Library Logbook Management System built for university libraries. It enables students, faculty, and visitors to browse the catalog, borrow and return books, track attendance, manage reservations, receive notifications, and more — all from a phone-sized interface.

| Attribute | Value |
|-----------|-------|
| Primary Color | `#652D90` (Purple) |
| Background (Light) | `#f2f2fa` (Lavender-tinted gray) |
| Background (Dark) | `oklch(0.13 0.04 300)` (~`#110a1e`, dark purple) |
| Max Viewport | 430px (mobile container) |
| Dark Mode | Supported (class-based toggle via next-themes) |
| Platform | Next.js 16 App Router, TypeScript |
| Database | SQLite via Prisma ORM |
| Test Accounts | `juan@university.edu` / `maria@university.edu` / `alex@university.edu` (password: `password123`) |

---

## 2. Screens & UI Features

### 2.1 Onboarding (5-Step Registration Wizard)

**Screen:** `OnboardingScreen` | **Route:** Internal (Zustand state)

A multi-step registration flow for new users with animated step-by-step progression:

| Step | Title | Features |
|------|-------|----------|
| 0 | Welcome / Role Selection | 3 role cards (Student, Faculty, Visitor) with icons + emojis, selection animation with checkmark |
| 1 | Personal Information | Full Name input, University ID input, real-time validation |
| 2 | Academic Information | Program dropdown (10 options), Department dropdown (8 for faculty), Year Level grid selector (5 for students), Visitor info card |
| 3 | Account Setup | Email input, Password with show/hide toggle, 4-level strength meter (Weak/Fair/Good/Strong), Confirm password with match validation |
| 4 | Notification Preferences | Due Date Reminders toggle (default on), Reservation Alerts toggle (default on), System Announcements toggle (forced off), Confetti animation on entry |

**Validation:** Each step has `canContinue()` guards before progression.

**Animations:** Slide transitions between steps (directional, 300ms), spring animations on step icons, staggered card entry, checkmark spring, progress bar gradient fill, step dot indicators with icon-to-checkmark transitions, confetti particles (20 animated) on final step.

---

### 2.2 Login

**Screen:** `LoginScreen` | **Route:** Internal

User authentication screen with branded design:

- **Living gradient header** with two animated gradient layers shifting through 4 color states each (8s & 10s cycles) for parallax effect
- **LibLog logo** with spring scale + rotate animation + continuous glow pulse (2.5s cycle)
- **Glass-card form** overlapping header (-mt-10):
  - Email input with GraduationCap icon + focus color transitions
  - Password input with show/hide toggle + focus ring
  - "Forgot password?" link (placeholder)
  - Sign In button with gradient + shimmer-loading effect + pulsing glow when email is valid (2s cycle)
  - Loading state: spinner + "Signing in..."
  - "Use Demo Account" button (auto-fills juan@university.edu / password123)
  - Register link → navigates to onboarding
- **Footer:** Terms of Service / Privacy Policy text

**Keyboard:** Enter key on password field triggers login.

---

### 2.3 Home (Dashboard)

**Screen:** `HomeScreen` | **Route:** Internal (main authenticated screen)

Personalized landing page with clean card-based layout:

1. **Top Bar:** Streak counter in orange rounded pill card (`bg-orange-400 dark:bg-orange-500 rounded-full` with Flame icon, white text), Notifications bell icon inside `rounded-[22px] bg-card dark:shadow-sm` squircle card (with unread badge), Settings gear icon inside same-style squircle card
2. **User Greeting:** Date display (uppercase, muted), time-of-day greeting with crossfade transition — greeting text is NOT bold ("Good afternoon,"), user name IS bold ("**Juan!**") — implemented as `<h1 className="text-2xl">Good afternoon, <span className="font-bold">Juan!</span></h1>`, program/year/role subtitle below
3. **Library Status Badge:** Open/Closed indicator with pulsing green dot when Open (2s cycle) + closing time
4. **Announcements Card:** `bg-card rounded-3xl dark:shadow-sm p-4` card, auto-rotating (5s interval), dismissible with megaphone icon on card header row, carousel dot navigation
5. **Today's Highlight Card:** `bg-card rounded-3xl dark:shadow-sm p-4` card with featured book, Sparkles icon on card header row
6. **Current Borrow Card:** `bg-card rounded-3xl dark:shadow-sm p-4` card with active book, animated gradient left border (scaleY 0→1 on mount), progress bar, days-left badge (color-coded), "View Details" button. Empty state with floating book animation + "Browse Catalog" CTA
7. **2-Column Square Cards:** Attendance Analytics + Reading Goal side by side (both `aspect-square`), each in `bg-card rounded-3xl dark:shadow-sm p-4`:
   - **Attendance Analytics:** Visit count, total hours, streak count
   - **Reading Goal:** Circular SVG progress ring, borrowCount/readingGoal ratio
8. **Recommended for You Card:** `bg-card rounded-3xl dark:shadow-sm p-4` card with horizontal scrollable book covers, "For You" star badges (program-matched), availability dots, "See All" link
9. **Trending in Your Department Card:** `bg-card rounded-3xl dark:shadow-sm p-4` card with TrendingUp icon on card header row, ranked list (1–5) with borrow counts as plain "X borrows" text (no Clock icons), numbered badges

**Key Design Changes (from Tasks 10–12):**
- Quick Actions section removed entirely (was 4-button grid: Scan QR, My Loans, Reservations, Attendance)
- Purple bar dividers removed from section headers
- No background patterns on section titles (section-header-pattern removed)
- All sections wrapped in `bg-card rounded-3xl dark:shadow-sm p-4` cards
- Consistent spacing: `px-5 pt-6 pb-5` header, `px-5 pb-6 space-y-4` content
- Section icons (Megaphone, Sparkles, TrendingUp) placed on right side of card header rows

**Gesture:** Pull-to-refresh (60px threshold, animated pull indicator).

**Skeleton Loading:** Dedicated SkeletonCard and SkeletonRecommendations components.

---

### 2.4 Search (Catalog Browser)

**Screen:** `SearchScreen` | **Route:** Internal

Resource catalog search and browsing:

- **Search input** with Search icon + clear button (X)
- **Popular search suggestions** (6 tags: Algorithms, Deep Learning, Database, Nursing, Psychology, Clean Code) — shown when focused or empty
- **Category filter pills** with spring animation on selection (whileTap scale 0.92, layout prop for smooth transitions)
- **Animated result count** with purple text glow pulse on count change (600ms)
- **Recently Viewed** horizontal scroll (when search empty)
- **Result cards:** Cover image, title, author, category badge, tag pills (max 2), availability indicator
- **Empty state** with search icon
- **Skeleton loading** — 4 skeleton cards with staggered entrance (replaces spinner)

**Debounce:** 300ms on search input change.

---

### 2.5 Book Detail

**Screen:** `BookDetailScreen` | **Route:** Internal

Detailed resource view with borrow/reserve actions:

- **Purple gradient header** with decorative circles, back button, share button
- **Book cover** (overlapping header, -mt-12): image or decorative pattern + category badge + heart/favorite button
- **Metadata:** Title, author, availability badge (green/red), shelf location (MapPin icon), ISBN badge, publication date badge, subject badge
- **Description:** "About this book" section
- **Tags** as pills
- **Ratings & Reviews section:**
  - Rating summary card with average rating, star count, review count, distribution bars (5★→1★)
  - Write/Edit review button with inline form: star selector (1-5), comment textarea (200 char max), Submit/Cancel
  - Reviews list with avatar initials, name, role badge, star rating, date, comment; delete button on own reviews
  - Empty state: "No reviews yet. Be the first to review!"
- **Action buttons:** Borrow (when available) or Reserve (when unavailable) + Share button
- **"More Resources"** related books section
- **Share toast:** "Copied to clipboard!" notification

**Favorite Toggle:** Heart icon with animated scale + color change.

**Share:** Web Share API (native) or clipboard copy fallback.

---

### 2.6 My Loans (Borrowed Books)

**Screen:** `BorrowedScreen` | **Route:** Internal

Active loans and borrowing history:

- **Tab switcher:** Active / History (with counts)
- **Summary stats bar:** Active count + Returned count with colored dots
- **Fines Summary Card** (when overdue items exist): Red-themed card with AlertTriangle icon, total fines owed, overdue count, fine rate (₱5.00/day), "Pay at the circulation desk" note
- **Overdue Fine Badges:** Red "Overdue Fine: ₱XX.XX" badge with "Overdue X days · Fine: ₱XX.XX" per book
- **Due Soon Warnings:** Amber "Due soon — return within X days to avoid fines" for books 1-3 days from due
- **Color-coded accent borders:** Red gradient for overdue, amber for due-soon, purple for normal
- **Success animation:** Confetti particles + green checkmark overlay on successful book return (2s display)
- **Active book cards:** Cover image, title, author, borrow/due dates, gradient left border, days-left badge (color-coded), Return button
- **History book cards:** "Returned on [date]" badge with checkmark, View button
- **Empty state** with "Browse Catalog" CTA

**Actions:** Return book → marks as returned + increments available copies + shows celebration animation.

---

### 2.7 Profile

**Screen:** `ProfileScreen` | **Route:** Internal

User profile, statistics, reading goals, and menu:

- **Purple gradient header** with avatar initials, name, email, role badge, program/year, university ID
- **Stats cards (3 columns):** Borrowed count, Visits count, Streak count
- **Reading Goal card:** Circular SVG progress ring, goal/borrowed count, "Change" button with goal picker (12/24/36/48)
- **Reading Stats card:** Mini bar chart (7 months), total books, average per month
- **Attendance History card** with visit count and navigation link
- **Member Since** info card
- **Menu items:** Edit Profile (→ Edit Profile screen), My Favorites, My Reservations

**Reading Goal Picker:** Toggle overlay to select from 12/24/36/48 annual goal.

**Bar Chart:** Animated height growth (0.4s per bar, staggered 0.05s).

---

### 2.8 QR Scanner

**Screen:** `QRScanScreen` | **Route:** Internal

Simulated QR code scanner for attendance and book checkout:

- **Dark background** (#0d0d1a)
- **Mode indicator badge:** Attendance / Checkout
- **Viewfinder:** 256×256 box with animated scan line, corner brackets (outer + inner accents), center ScanLine icon with pulse
- **Mode buttons:** "Attendance Check-in" / "Book Checkout"
- **Flash toggle** (torch on/off, visual only)
- **Success modal:** Green checkmark with spring animations, success message, timestamp, "Scan Again" / "Done" buttons

**Simulation:** Auto-simulated scan (2s wait → 3s scanning → success).

---

### 2.9 Attendance

**Screen:** `AttendanceScreen` | **Route:** Internal

Library attendance tracking with calendar heatmap:

- **Summary cards (3):** Total Visits, Total Hours, Day Streak
- **Calendar heat map:** Month/year label, 7-column grid (Sun–Sat), attended days highlighted purple, today with ring indicator, legend
- **Recent Visits list:** Date, time-in → time-out, duration badge

**Fallback:** 11 mock records if API returns empty.

---

### 2.10 Notifications

**Screen:** `NotificationsScreen` | **Route:** Internal

View and manage notifications:

- **"Mark all read" button**
- **Filter tabs:** All, Unread (with count badge), Mentions (reservation type)
- **Grouped notifications:** Today, Yesterday, This Week, Earlier — with group headers and counts
- **Notification cards:** Type-colored left border + icon (orange=due_date, purple=reservation, blue=announcement), title, message, relative time, unread dot
- **Empty state**

**Gesture:** Swipe-to-dismiss (drag x > 100px threshold dismisses, spring snap-back if under).

---

### 2.11 Reservations

**Screen:** `ReservationsScreen` | **Route:** Internal

Manage book reservations:

- **Active count** + bookmark icon
- **Filter tabs:** All, Pending (with count), Fulfilled
- **Reservation cards:** Cover image, title, author, status badge (Pending=yellow, Fulfilled=green, Cancelled=red), date
  - Pending: "Cancel" button
  - Fulfilled: "Borrow Now" button
- **Empty state** with "Browse Catalog" CTA

**Actions:** Cancel reservation (soft-cancel → status changed to "cancelled").

---

### 2.12 Favorites

**Screen:** `FavoritesScreen` | **Route:** Internal

View and manage favorite/saved books:

- **Count** + heart icon
- **Book cards:** Cover image, title, author, category badge, availability, trash/remove button
- **Empty state** with heart icon + "Browse Catalog" CTA

**Actions:** Remove from favorites with exit animation (slide-left + collapse).

---

### 2.13 Settings

**Screen:** `SettingsScreen` | **Route:** Internal

App settings and account management:

1. **Account:** Avatar + name/email, "Change Password" button, Email with "Verified" badge
2. **Notifications:** Due Date Reminders switch, Reservation Alerts switch, System Announcements switch — each toggle persists to API
3. **Appearance:** Dark Mode toggle (via next-themes)
4. **Help:** "How to use CCC's Library Logbook MS" with "Open Help guide →" link
5. **About:** App Version (1.0.0), Privacy Policy, Terms of Service
6. **Log Out** button (red)

**Password Change Modal (bottom sheet):**
- Current password + show/hide
- New password + show/hide + strength meter
- Confirm new password + match validation
- Error display
- Cancel / Change Password buttons

---

### 2.14 Edit Profile

**Screen:** `EditProfileScreen` | **Route:** Internal

Update user profile information:

- **Purple gradient header** with back button, title, avatar with camera icon overlay
- **Form fields:**
  - Full Name (editable)
  - Email (disabled — "Email cannot be changed")
  - University ID (disabled — "University ID cannot be changed")
  - Program/Department dropdown (10 programs for students, 8 departments for faculty)
  - Year Level selector (5 options for students only)
- **Save button** — calls PUT /api/auth/update, updates Zustand store, navigates back with success toast
- **Cancel button** — navigates back without saving
- **Loading state** on save button

---

## 3. API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email + password. Returns user object (SHA-256 hash verification). |
| POST | `/api/auth/register` | Register new user. Validates required fields, checks email + universityId uniqueness, hashes password, generates avatar initials. |
| PUT | `/api/auth/update` | Update user profile (fullName, program, department, yearLevel), notification preferences, or change password (verifies current password before allowing change). |

### Resources (Catalog)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/resources` | List/search resources. Query params: `category`, `subject`, `search` (OR across title/author/tags/subject), `page`, `limit`. Returns resources + pagination. |
| GET | `/api/resources/[id]` | Get single resource with related borrow records (active/overdue, last 5) and reservations (pending, last 5). |

### Borrowing

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/borrow` | List borrow records. Query params: `userId` (required), `status` (active/returned/overdue). Returns records with resource details. |
| POST | `/api/borrow` | Borrow a book. Validates availability, checks role-based max borrow limit (student:3, faculty:10, visitor:1), calculates role-based due date (student:14d, faculty:30d, visitor:7d). Transaction: create record + decrement available copies. |
| POST | `/api/borrow/[id]/return` | Return a book. Checks not already returned, calculates late status. Transaction: update record + increment available copies. |

### Reservations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reservations` | List reservations. Query param: `userId` (required). Returns reservations with resource details. |
| POST | `/api/reservations` | Create reservation. Validates user + resource, checks no existing pending reservation for same user+resource. |
| DELETE | `/api/reservations/[id]` | Cancel reservation (soft-cancel: sets status to "cancelled" rather than deleting). |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List notifications. Query param: `userId` (required). Returns notifications + unread count. |
| PUT | `/api/notifications/[id]/read` | Mark a notification as read. |

### Attendance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/attendance` | List attendance records. Query params: `userId`, `date` (YYYY-MM-DD). Returns records with user info. |
| POST | `/api/attendance` | Record attendance. `type: "time-in"` checks no existing open record today, creates new. `type: "time-out"` finds today's open record, calculates duration, sets timeOut. |

### Library Settings & Announcements

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get library settings (hours, borrow limits, QR validity). Creates defaults if none exist. |
| PUT | `/api/settings` | Update library settings. |
| GET | `/api/announcements` | List active announcements. Ordered by newest first. |

### Reviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reviews` | Get reviews for a resource. Query param: `resourceId` (required). Returns reviews with user info + stats (averageRating, totalReviews, distribution). |
| POST | `/api/reviews` | Create or update a review. Body: `{ userId, resourceId, rating (1-5), comment? }`. Upserts (one review per user per resource). |
| DELETE | `/api/reviews/[id]` | Delete a review. |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/` | Returns `{ message: "Hello, world!" }` for health check. |

---

## 4. Database Models

### User

| Field | Type | Notes |
|-------|------|-------|
| id | String @id | cuid() auto-generated |
| email | String @unique | Login identifier |
| password | String | SHA-256 hashed |
| fullName | String | Display name |
| universityId | String @unique | Student/faculty/visitor ID |
| role | String | student / faculty / visitor / librarian |
| program | String? | Academic program |
| department | String? | Department (faculty) |
| yearLevel | String? | Year level (students) |
| avatarInitials | String? | Auto-generated from name |
| notificationDueDate | Boolean | Default: true |
| notificationReservation | Boolean | Default: true |
| notificationAnnouncements | Boolean | Default: false |
| streakCount | Int | Default: 0 |
| streakLastDate | String? | Last streak date |
| isOnboarded | Boolean | Default: false |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

**Relations:** borrowedBooks (BorrowRecord[]), attendance (Attendance[]), reservations (Reservation[]), notifications (Notification[]), reviews (Review[])

---

### Resource

| Field | Type | Notes |
|-------|------|-------|
| id | String @id | cuid() |
| title | String | Book/resource title |
| author | String | Author name |
| isbn | String? | ISBN identifier |
| issn | String? | ISSN identifier |
| category | String | book / research / magazine |
| copies | Int | Total copies (default: 1) |
| availableCopies | Int | Currently available (default: 1) |
| shelfLocation | String? | Physical location |
| abstract | String? | Description/abstract |
| publicationDate | String? | Publication date |
| coverImage | String? | Cover image URL/path |
| subject | String? | Academic subject |
| tags | String? | Comma-separated tags |
| status | String | available / borrowed / reserved / reference-only / maintenance |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

**Relations:** borrowRecords (BorrowRecord[]), reservations (Reservation[]), reviews (Review[])

---

### BorrowRecord

| Field | Type | Notes |
|-------|------|-------|
| id | String @id | cuid() |
| userId | String | FK → User |
| resourceId | String | FK → Resource |
| borrowDate | DateTime | When borrowed |
| dueDate | DateTime | Calculated from role |
| returnDate | DateTime? | When returned (null if active) |
| status | String | active / returned / overdue |
| isLate | Boolean | Default: false |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

**Relations:** user (User), resource (Resource)

---

### Attendance

| Field | Type | Notes |
|-------|------|-------|
| id | String @id | cuid() |
| userId | String | FK → User |
| date | String | YYYY-MM-DD |
| timeIn | DateTime? | Check-in time |
| timeOut | DateTime? | Check-out time |
| duration | Int? | Total minutes |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

**Relations:** user (User)

---

### Reservation

| Field | Type | Notes |
|-------|------|-------|
| id | String @id | cuid() |
| userId | String | FK → User |
| resourceId | String | FK → Resource |
| status | String | pending / fulfilled / cancelled |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

**Relations:** user (User), resource (Resource)

---

### Notification

| Field | Type | Notes |
|-------|------|-------|
| id | String @id | cuid() |
| userId | String | FK → User |
| type | String | due_date / reservation / announcement / inquiry |
| title | String | Notification title |
| message | String | Notification body |
| isRead | Boolean | Default: false |
| createdAt | DateTime | Auto |

**Relations:** user (User)

---

### LibrarySettings

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| id | String @id | cuid() | |
| isOpen | Boolean | true | Library open status |
| closingTime | String | "21:00" | Closing time |
| openingTime | String | "07:00" | Opening time |
| maxBorrowStudent | Int | 3 | Max concurrent borrows for students |
| maxBorrowFaculty | Int | 10 | Max concurrent borrows for faculty |
| maxBorrowVisitor | Int | 1 | Max concurrent borrows for visitors |
| borrowDaysStudent | Int | 14 | Borrow period for students |
| borrowDaysFaculty | Int | 30 | Borrow period for faculty |
| borrowDaysVisitor | Int | 7 | Borrow period for visitors |
| qrValidityMinutes | Int | 15 | QR code validity window |
| updatedAt | DateTime | Auto | |

---

### Announcement

| Field | Type | Notes |
|-------|------|-------|
| id | String @id | cuid() |
| title | String | Announcement title |
| message | String | Announcement body |
| targetRoles | String | all / student / faculty / visitor |
| isActive | Boolean | Default: true |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

---

### Review

| Field | Type | Notes |
|-------|------|-------|
| id | String @id | cuid() |
| userId | String | FK → User |
| resourceId | String | FK → Resource |
| rating | Int | 1–5 stars |
| comment | String? | Optional review text |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

**Relations:** user (User), resource (Resource)
**Unique constraint:** `@@unique([userId, resourceId])` — one review per user per resource

---

## 5. State Management

**Store:** Zustand with `persist` middleware → `localStorage` key `liblog-store`

### Persisted State

Only the following fields are persisted to localStorage. The store does **NOT** persist `currentScreen` or `isAuthenticated` — the app always starts at the login screen on open.

| Variable | Type | Default | Persisted | Description |
|----------|------|---------|-----------|-------------|
| currentScreen | AppScreen | `'onboarding'` | ❌ No | Current active screen (always resets to `login` on app open) |
| previousScreen | AppScreen\|null | `null` | ❌ No | For goBack() navigation |
| isAuthenticated | boolean | `false` | ❌ No | Login status (always resets to `false` on app open) |
| user | UserState\|null | `null` | ✅ Yes | Full user data |
| onboardingStep | number | `0` | ✅ Yes | Current onboarding step (0–4) |
| onboardingData | object | *(defaults)* | ✅ Yes | Registration form data accumulator |
| selectedBookId | string\|null | `null` | ❌ No | Book for detail view |
| searchQuery | string | `''` | ❌ No | Active search text |
| searchCategory | string | `'all'` | ❌ No | Active category filter |
| unreadCount | number | `3` | ❌ No | Unread notification count |
| favorites | string[] | `[]` | ✅ Yes | Favorited resource IDs |

### Rehydration Behavior

On app open, the `onRehydrateStorage` callback always resets:
- `isAuthenticated` → `false`
- `currentScreen` → `'login'`

This ensures users always start at the login screen, even if they closed the app while authenticated.

### Actions

| Action | Description |
|--------|-------------|
| `setCurrentScreen(screen)` | Navigate to screen, saves previous for back-nav |
| `goBack()` | Navigate to previousScreen (or home as fallback) |
| `setUser(user)` | Set user data + isAuthenticated = true |
| `logout()` | Clear user, reset all state to defaults |
| `setOnboardingStep(step)` | Set onboarding step |
| `setOnboardingData(data)` | Merge partial onboarding data |
| `resetOnboarding()` | Reset step = 0 + data to defaults |
| `setSelectedBookId(id)` | Set book for detail view |
| `setSearchQuery(query)` | Update search text |
| `setSearchCategory(cat)` | Update category filter |
| `setUnreadCount(count)` | Update notification badge |
| `toggleFavorite(id)` | Add/remove from favorites array |
| `isFavorite(id)` | Check if ID is in favorites |

### AppScreen Union Type

```
'onboarding' | 'home' | 'search' | 'qr-scan' | 'borrowed' |
'profile' | 'settings' | 'notifications' | 'book-detail' | 'login' |
'attendance' | 'favorites' | 'reservations' | 'edit-profile'
```

---

## 6. Authentication & Security

- **Password Hashing:** SHA-256 via Web Crypto API (`src/lib/auth.ts`)
- **Session:** Client-side only (Zustand + localStorage) — no server sessions
- **Auth Guard:** Unauthenticated users can only see login/onboarding screens
- **Persistence:** `currentScreen` and `isAuthenticated` are NOT persisted — app always starts at login on open
- **Role-Based Access Control:**
  - **Student:** Max 3 concurrent borrows, 14-day loan period
  - **Faculty:** Max 10 concurrent borrows, 30-day loan period
  - **Visitor:** Max 1 concurrent borrow, 7-day loan period
- **Password Strength Meter:** Checks length, uppercase, numbers, special characters (4 levels: Weak/Fair/Good/Strong)
- **Registration Validation:** Email uniqueness, university ID uniqueness, required fields per step

---

## 7. Theme & Design System

### Background Colors

| Mode | Color | Description |
|------|-------|-------------|
| Light | `#f2f2fa` | Lavender-tinted gray (subtle purple warmth) |
| Dark | `oklch(0.13 0.04 300)` | Dark purple (~`#110a1e` area) |

### Shadow System

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Cards (all screens) | **No shadow** | `dark:shadow-sm` or `dark:shadow-*` |
| Buttons | **No shadow** | `dark:shadow-*` (varies) |
| Images | **No shadow** | `dark:shadow-*` (varies) |
| Modals | **No shadow** | `dark:shadow-2xl` |
| BottomNav | `shadow-sm` | `shadow-sm` (both modes) |
| QR Scan center button | `shadow-*` | `shadow-*` (both modes) |
| Mobile container | **No shadow** | `dark:shadow-xl` |

**Implementation:** In `globals.css`, the following custom CSS classes only have `box-shadow` in the `.dark` context:
- `card-hover-effect` — shadow only in `.dark .card-hover-effect:hover`
- `hover-lift` — shadow only in `.dark .hover-lift:hover`
- `glass-card` — shadow only in `.dark` variant
- `press-effect` — shadow only in `.dark .press-effect:active`

**Exceptions:** BottomNav and QR scan center button retain shadows in both light and dark modes.

### Brand Colors

| Shade | Hex |
|-------|-----|
| 50 | #F5EDF9 |
| 100 | #E8D5F3 |
| 200 | #D4ADE7 |
| 300 | #B87DD4 |
| 400 | #9B5BBF |
| **500 (Primary)** | **#652D90** |
| 600 | #5A2880 |
| 700 | #4A2068 |
| 800 | #3A1850 |
| 900 | #2A1038 |
| Light | #7B3FA8 |
| Dark | #522575 |

### Custom CSS Classes

| Class | Purpose | Shadow Behavior |
|-------|---------|-----------------|
| `bg-purple-gradient` | Purple gradient background | N/A |
| `bg-purple-gradient-subtle` | Lighter purple gradient | N/A |
| `glass-effect` / `glass-card` | Frosted glass with backdrop blur | Shadow only in `.dark` context |
| `card-hover-effect` | Hover lift + purple shadow | Shadow only in `.dark` context |
| `purple-shimmer` | Animated gradient shimmer | N/A |
| `cover-pattern-overlay` | Diagonal stripes overlay on book covers | N/A |
| `gradient-border` | Animated gradient border effect | N/A |
| `dot-pattern-bg` | Decorative dot pattern | N/A |
| `grid-pattern-bg` | Decorative grid pattern | N/A |
| `section-header-pattern` | Section header decoration (legacy, no longer used on Home) | N/A |
| `shimmer-loading` | Button shimmer sweep animation | N/A |
| `press-effect` | Active scale-down for buttons | Shadow only in `.dark` context |
| `hover-lift` | Subtle hover lift | Shadow only in `.dark` context |
| `gradient-text` | Purple gradient text fill | N/A |
| `safe-bottom` | iOS safe area padding | N/A |
| `custom-scrollbar` | Styled scrollbar | N/A |
| `hide-scrollbar` | Hidden scrollbar | N/A |

### Card Corner Radius

| Element | Radius | Tailwind Class |
|---------|--------|---------------|
| Section cards (all screens) | 24px | `rounded-3xl` |
| Inner card elements | 16px | `rounded-2xl` |
| Small icon containers | 22px | `rounded-[22px]` |
| Streak pill | Full | `rounded-full` |

### Dark Mode (Dark Purple Theme)

- **Class-based toggle** via `next-themes`
- **Overall background:** `#110a1e` (dark purple close to black)
- **Card backgrounds:** `bg-card` with dark purple CSS variable `oklch(0.18 0.05 300)`
- **Bottom nav:** `dark:bg-[#1a0e2e]/90` with `dark:border-white/5`
- **Transparency system** (replaces all `dark:bg-gray-*` patterns):
  - `dark:bg-white/5` — subtle background
  - `dark:bg-white/10` — medium background / icon containers
  - `dark:bg-white/15` — emphasized background
- **Border system** (replaces all `dark:border-gray-*` patterns):
  - `dark:border-white/5` — subtle borders
  - `dark:border-white/10` — standard borders
- **Text accents:** `dark:text-lib-purple-300` for purple-accented text (70+ instances across all screens)
- **Inactive nav icons:** `dark:text-white/30`
- **Dark mode card backgrounds for form-heavy screens:** `dark:bg-[#1a0e2e]`
- **CSS variables in globals.css `.dark`:** Use purple hue (300) in oklch instead of achromatic (0)
- **Toggle available** in Settings screen
- **Full dark theme CSS variables:** Enhanced shadows, dark scrollbar, dark glass effects, dark skeleton shimmer

---

## 8. Animations & Micro-Interactions

### Screen-Level Animations
- **Screen transitions:** AnimatePresence mode="wait" with opacity + y:8 slide
- **Onboarding step transitions:** Directional slide (left/right, 300ms)
- **Tab content switching:** AnimatePresence with x-slide

### Component Animations
- **Staggered entry:** Cards, menu items, stats with configurable delays
- **Spring animations:** Logo entrance, checkmarks, success modal elements
- **Pull-to-refresh:** Touch-based with 60px threshold
- **Swipe-to-dismiss:** Notifications with spring snap-back (x > 100px threshold)
- **Floating icons:** Login screen book icons (6s loop)
- **Confetti:** 20 particles on onboarding final step, 18 particles on book return success

### Keyframe Animations (Defined in CSS)
`shimmer` · `floating` · `pulse-glow` · `slide-in` · `slide-in-up` · `fade-in` · `particle-float` · `gradient-shift` · `subtle-bounce` · `micro-pulse-glow` · `confetti-fall` · `checkmark-draw` · `float-icon` · `count-up` · `badge-shimmer` · `shimmer-sweep` · `star-fill` · `progress-fill` · `skeleton-shimmer` · `badge-pulse` · `countdown-ring` · `slide-indicator` · `page-enter` · `page-exit`

---

## 9. Navigation & Layout

### Root Layout
- **Fonts:** Geist Sans + Geist Mono
- **ThemeProvider** (next-themes): class-based, default light, system-enabled
- **Toaster** component (shadcn/ui)
- **Viewport:** device-width, no user scaling, theme-color #652D90

### Mobile Container
- Max-width 430px, centered with `dark:shadow-xl` (shadow only in dark mode, no shadow in light mode)
- Full viewport height: `h-dvh` with `overflow-y-auto` on content area
- Screen routing via Zustand `currentScreen` → component map
- Auth guard: unauthenticated → login/onboarding only
- BottomNav visible for authenticated users (hidden on onboarding/login/qr-scan)
- Bottom nav uses `shrink-0` so it always sticks to the bottom of the viewport

### Bottom Navigation (5 Tabs)

| Tab | Icon | Screen | Special |
|-----|------|--------|---------|
| Home | Home | home | — |
| Search | Search | search | — |
| Scan | ScanLine | qr-scan | Center elevated button (-mt-6), purple circle, shadow in both modes |
| Borrowed | BookOpen | borrowed | Active borrows count badge |
| Profile | User | profile | — |

- **Active state:** Purple icon + font-semibold + animated dot indicator with bounce animation (scale [0, 1.5, 1])
- **Spring press feedback:** Scale to 0.85 with spring-back (stiffness: 500, damping: 12) on tab press
- **Scan button ripple:** RippleEffect component scales 0 → 2.5 with opacity fade
- **Glass effect** background
- **Shadow:** `shadow-sm` in both light and dark modes (exception to no-shadow rule)

---

## 10. Utility Libraries

### `src/lib/auth.ts`
- `hashPassword(password)` — SHA-256 hash via Web Crypto API
- `verifyPassword(password, hashedPassword)` — Compare hash
- `getAvatarInitials(fullName)` — First letter of first + last name
- `getBorrowDays(role, settings)` — Role→days mapping
- `getMaxBorrow(role, settings)` — Role→max books mapping

### `src/lib/covers.ts`
- `coverMap` — Maps 12 title keywords to `/covers/*.png` image paths:
  - `introduction-to-algorithms`, `clean-code`, `design-patterns`, `artificial-intelligence`, `ai-modern-approach`, `deep-learning`, `the-pragmatic-programmer`, `pragmatic-programmer` (alias), `database-systems`, `psychology`, `nursing`, `scientific-american`
- `getBookCover(title)` — Fuzzy-match title to cover image path
- `getResourceCover(coverImage, title)` — Priority: API coverImage > generated from title > null

### `src/lib/db.ts`
- PrismaClient singleton (prevents multiple instances in dev)
- Logging enabled

### `src/lib/utils.ts`
- `cn(...inputs)` — Tailwind CSS class merge utility (clsx + twMerge)

---

## 11. Seed / Test Data

### Test Accounts (password: `password123`)

| Role | Name | Email | University ID | Extra |
|------|------|-------|---------------|-------|
| Student | Juan Dela Cruz | juan@university.edu | CS-2024-0001 | CS program, 3rd Year, streak=5 |
| Faculty | Maria Santos | maria@university.edu | FAC-2024-0001 | CS Department, streak=12 |
| Visitor | Alex Reyes | alex@university.edu | VIS-2024-0001 | — |

### Resources (17 total)
- **10 Books:** Introduction to Algorithms, Clean Code, Design Patterns, Deep Learning, The Pragmatic Programmer, Database System Concepts, Operating System Concepts, Computer Networks, AI: A Modern Approach, Computer Architecture
- **4 Research:** ML: Probabilistic Perspective, Journal of CS Vol. 42, NeurIPS 2025, ACM Computing Surveys
- **3 Magazines:** National Geographic Mar 2026, Time Magazine Spring 2026, Scientific American Apr 2026

### Other Seed Data
- **Borrow Records (5):** 2 active + 1 overdue (student), 2 returned (1 late, 1 on time)
- **Notifications (6):** Due soon, overdue, reservation ready, library hours, reservation confirmed, return reminder
- **Announcements (2):** Extended hours for finals, New AI/ML arrivals
- **Reservations (1):** Student → Clean Code (pending)
- **Attendance (2):** Today (time-in only), Yesterday (7 hours)
- **Reviews (10):** Across 6 resources with ratings 2-5 and realistic comments
- **AI-Generated Book Covers (10):** `introduction-to-algorithms`, `clean-code`, `design-patterns`, `ai-modern-approach`, `deep-learning`, `the-pragmatic-programmer`, `database-systems`, `psychology-101`, `nursing-fundamentals`, `scientific-american` — saved in `/public/covers/` directory
- **Cover Images in Seed Data (6):** `coverImage` field populated for 6 most popular books (Introduction to Algorithms, Clean Code, Design Patterns, Deep Learning, The Pragmatic Programmer, AI: A Modern Approach)

---

## 12. Technology Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui (New York style, 40+ components) |
| Icons | Lucide React |
| Database | SQLite via Prisma ORM 6 |
| State Management | Zustand 5 (persist middleware) |
| Animations | Framer Motion 12 |
| Theming | next-themes (class-based dark mode) |
| Forms | react-hook-form + zod |
| Charts | Recharts |
| Tables | @tanstack/react-table + @tanstack/react-query |
| Auth | NextAuth.js v4 (available, not actively used) |
| Image Processing | Sharp |
| Fonts | Geist Sans + Geist Mono |

---

## 13. Branding & Design System Guide

A comprehensive branding guide is maintained in **`/home/z/my-project/BRANDING.md`** covering:

| Section | Contents |
|---------|----------|
| **Typography** | SF Pro Display (headings) + SF Pro Text (body) with H1–H6 scale, button text specs, font weight rules |
| **Color System** | Full purple palette (#652D90 + 10 shades), semantic tokens (oklch), neutral grays, contrast requirements |
| **Corner Rounding** | 9-level radius scale (0–9999px) with element-to-radius mapping for every UI component |
| **Spacing System** | 4px base unit, 14-step scale, layout spacing patterns, internal spacing rules |
| **Elevation & Shadows** | 7-level shadow hierarchy, brand-tinted purple shadows, elevation rules |
| **Gradients** | 5 brand gradients (light + dark variants), gradient usage rules |
| **Iconography** | Lucide React library, 6 icon sizes, 4 container sizes, color rules |
| **Motion & Animation** | 5 speed tiers, standard transitions, micro-interactions, animation rules |
| **Layout & Grid** | 430px container, grid patterns, safe areas |
| **Touch Targets** | Apple HIG minimums (44px), accessibility requirements (WCAG AA) |
| **Dark Mode** | 4-level surface hierarchy, color adaptation rules, element-specific treatments |
| **Components** | Button variants (7), card types (4), input specs, bottom nav specs |
| **Status Colors** | Success/Warning/Error/Info (light + dark), chart palette |
| **Imagery** | Book cover specs, avatar sizes, image treatment rules |
| **Writing & Tone** | Voice guidelines, copy length limits, number formatting |
| **Implementation** | Tailwind theme extensions, CSS custom properties, quick reference class mapping |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-05 | Initial FEATURES.md created — comprehensive catalog of all 13 screens, 19 API endpoints, 8 DB models, and all supporting systems |
| 2026-04-22 | Added Reviews/Ratings feature (3 API + UI + seed data), Edit Profile screen (14th screen), overdue fines display (₱5/day), AI-generated book covers (6 covers), comprehensive dark mode across all screens, micro-interactions (success confetti, living gradient, spring nav feedback, skeleton loading, search glow), Change Password modal fix |
| 2025-01-27 | Created comprehensive BRANDING.md — 16-section design system guide with SF Pro typography, full purple color palette, corner rounding scale, 4px spacing system, elevation hierarchy, gradient specs, iconography, motion guidelines, dark mode system, component specs, accessibility, and implementation reference |
| 2026-03-06 | Major update reflecting Tasks 10–13: Home screen redesign (removed Quick Actions, purple bar dividers, section-header-pattern; added card-based layout, 2-column Attendance+Reading Goal cards, orange streak pill, icon squircles); shadow system overhaul (all shadows removed in light mode except BottomNav + QR scan button; shadows only in `.dark` context for card-hover-effect, hover-lift, glass-card, press-effect); background changed to lavender-tinted `#f2f2fa` (light) and `oklch(0.13 0.04 300)` dark purple (dark); card corner radius standardized to `rounded-3xl` (24px); dark purple theme with transparency system (`dark:bg-white/5-15`, `dark:border-white/5-10`) replacing all `dark:bg-gray-*`; greeting changed to non-bold greeting text + bold user name; persistence changed to only persist `user`, `onboardingStep`, `onboardingData`, `favorites` (always starts at login); covers.ts expanded to 12 entries; 10 AI-generated book covers in `/public/covers/`; mobile container uses `dark:shadow-xl` instead of `shadow-xl`; bottom nav sticky with `h-dvh` layout |
