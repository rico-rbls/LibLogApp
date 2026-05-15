# LibLog — Universal Branding & Design System Guide

> **Version:** 2.0 (Universal)
> **Platforms:** React Native (Mobile) & React Vite (Desktop Dashboard)
> **Design Philosophy:** Clean, accessible, purple-forward academic library experience.

---

## 1. Color System (The CCC Identity)

The system utilizes a flat design in Light Mode (relying on background contrast) and a depth-based design in Dark Mode.

| Token | Hex | Tailwind Class | Usage |
|---|---|---|---|
| **Primary Brand** | `#652D90` | `bg-lib-purple` / `text-lib-purple` | Primary actions, active states, sidebar highlights |
| **Primary Light** | `#9B5BBF` | `bg-lib-purple-400` | Hover states, gradient highlights |
| **Primary Dark** | `#4A2068` | `bg-lib-purple-700` | Pressed states |
| **Subtle Surface** | `#F5EDF9` | `bg-lib-purple-50` | Muted backgrounds, secondary buttons |
| **Page Bg (Light)** | `#f2f2fa` | `bg-background` | Lavender-tinted gray for natural visual layering |
| **Card Bg (Light)** | `#FFFFFF` | `bg-card` | Data tables, inventory grids, logbook cards |
| **Page Bg (Dark)** | `#110a1e` | `dark:bg-background` | Deep purple-black base |
| **Card Bg (Dark)** | `oklch(0.18 0.05 300)`| `dark:bg-card` | Dark purple surfaces |

## 2. Typography & Hierarchy

**Font Family:** Geist Sans (Fallback: Inter, system-ui, sans-serif).

| Level | Size (Mobile/Desktop) | Weight | Usage |
|---|---|---|---|
| **H1** | 30px / 36px | Bold (700) | App titles, Dashboard Hero |
| **H2** | 24px / 28px | Bold (700) | Major screen titles, KPI Stats |
| **H3** | 20px / 24px | Semibold (600) | Section headers |
| **Body** | 16px / 16px | Regular (400) | Primary content, table data |
| **Caption** | 12px / 12px | Medium (500) | Metadata, timestamps, table headers |

## 3. Corner Rounding (Border Radius)

| Token | Value | Tailwind Class | Application |
|---|---|---|---|
| **SM** | 8px | `rounded-sm` | Small badges, tags |
| **LG** | 12px | `rounded-xl` | Primary buttons, text inputs, icon containers |
| **XL** | 16px | `rounded-2xl` | Inner card elements, book cover images |
| **3XL** | 24px | `rounded-3xl` | Standard cards, modal windows, desktop panels |

## 4. Elevation & Shadows (Strict Rules)

> **Major Design Principle:** Light mode is FLAT. No shadows on content cards. Visual separation is achieved via the `#f2f2fa` background versus `#FFFFFF` cards. 

* **Light Mode Exceptions:** Only persistent floating elements (Mobile BottomNav, Mobile FAB, Desktop active dropdowns) receive `shadow-lg`.
* **Dark Mode Rule:** Use `dark:shadow-sm` on cards to provide depth against the dark purple base.

## 5. Platform-Specific Layout Constraints

* **Mobile (React Native):** * Max-width constraint.
    * Bottom Navigation with persistent elevated `#652D90` scan button.
    * Touch targets minimum 48x48px (`h-12`).
* **Desktop (Vite/Web):** * Sidebar layout (`w-64`) with active route highlighted in `#652D90`.
    * High-density data tables for Books and Patrons.
    * Data grids optimized for mouse interaction (hover states).