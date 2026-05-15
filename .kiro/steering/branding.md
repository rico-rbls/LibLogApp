# LibLog — Mobile Branding & Design System Guide

> **Version:** 1.1  
> **Last Updated:** 2026-03-04  
> **Platform:** iOS-first Mobile App (max-width 430px)  
> **Design Philosophy:** Clean, accessible, purple-forward academic library experience

---

## Table of Contents

1. [Typography](#1-typography)
2. [Color System](#2-color-system)
3. [Corner Rounding](#3-corner-rounding)
4. [Spacing System](#4-spacing-system)
5. [Elevation & Shadows](#5-elevation--shadows)
6. [Gradients](#6-gradients)
7. [Iconography](#7-iconography)
8. [Motion & Animation](#8-motion--animation)
9. [Layout & Grid](#9-layout--grid)
10. [Touch Targets & Accessibility](#10-touch-targets--accessibility)
11. [Dark Mode Guidelines](#11-dark-mode-guidelines)
12. [Component Specifications](#12-component-specifications)
13. [Status & Semantic Colors](#13-status--semantic-colors)
14. [Imagery & Photography](#14-imagery--photography)
15. [Writing & Tone](#15-writing--tone)
16. [Implementation Reference](#16-implementation-reference)

---

## 1. Typography

### Font Family

| Role | Font | Fallback Chain |
|---|---|---|
| **Primary / Body** | SF Pro Text | -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif |
| **Display / Headings** | SF Pro Display | -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif |
| **Monospace / Code** | SF Mono | 'Fira Code', 'Cascadia Code', 'Consolas', monospace |
| **Current Implementation** | Geist Sans | Inter, system-ui, sans-serif |

> **Migration Note:** The current codebase uses Geist Sans. To switch to SF Pro, update the font import in `globals.css` and `layout.tsx`. SF Pro is available on all Apple platforms natively via `-apple-system`.

### Heading Scale (SF Pro Display)

| Level | Size | Line Height | Weight | Letter Spacing | Tracking Class | Usage |
|---|---|---|---|---|---|---|
| **H1** | 30px | 36px (1.2) | Bold (700) | -0.5px | `text-3xl tracking-tight` | App title, hero text (e.g. "LibLog" on login) |
| **H2** | 24px | 30px (1.25) | Bold (700) | -0.3px | `text-2xl tracking-tight` | Major screen titles, large stats |
| **H3** | 20px | 26px (1.3) | Semibold (600) | -0.2px | `text-xl` | Screen headers, section titles |
| **H4** | 18px | 24px (1.33) | Semibold (600) | 0px | `text-lg` | Card titles, subsection headers |
| **H5** | 16px | 22px (1.375) | Medium (500) | 0px | `text-base font-medium` | List item titles, inline headers |
| **H6** | 14px | 20px (1.43) | Medium (500) | 0.1px | `text-sm font-medium` | Small section labels, caption headers |

### Body & Supporting Text (SF Pro Text)

| Role | Size | Line Height | Weight | Class | Usage |
|---|---|---|---|---|---|
| **Body** | 16px | 24px (1.5) | Regular (400) | `text-base` | Primary content, paragraphs, descriptions |
| **Body Small** | 14px | 20px (1.43) | Regular (400) | `text-sm` | Secondary content, card body text |
| **Caption** | 12px | 16px (1.33) | Regular (400) | `text-xs` | Metadata, timestamps, helper text |
| **Micro** | 10px | 14px (1.4) | Medium (500) | `text-[10px]` | Tiny labels, badges, nav labels |
| **Nano** | 9px | 12px (1.33) | Medium (500) | `text-[9px]` | Category chips on covers |
| **Ultra** | 8px | 11px (1.375) | Semibold (600) | `text-[8px]` | Only for book cover category overlays |

### Button Text

| Type | Size | Weight | Letter Spacing | Class |
|---|---|---|---|---|
| **Primary Button** | 16px | Semibold (600) | 0.2px | `text-base font-semibold tracking-wide` |
| **Secondary Button** | 14px | Medium (500) | 0.1px | `text-sm font-medium` |
| **Small/Button** | 12px | Medium (500) | 0px | `text-xs font-medium` |

### Font Weight Reference

| Name | Value | Tailwind Class | Usage |
|---|---|---|---|
| Regular | 400 | `font-normal` | Body text, descriptions |
| Medium | 500 | `font-medium` | Subtle emphasis, labels, small headers |
| Semibold | 600 | `font-semibold` | Buttons, card titles, emphasis |
| Bold | 700 | `font-bold` | Headings, screen titles, strong emphasis |

> **Rule:** Never use Light (300) or Thin (100) weights on mobile — they fail readability tests below 14px.

### Dynamic Type Support

All text should respect the user's Dynamic Type setting on iOS:
- Use `rem` units where possible
- Test at accessibility sizes (up to 2x)
- Ensure layouts don't break when text scales

---

## 2. Color System

### Primary Brand Color

| Name | Hex | RGB | Usage |
|---|---|---|---|
| **Lib Purple** | `#652D90` | rgb(101, 45, 144) | Primary brand, buttons, accents, icons |

### Full Purple Palette

| Token | Hex | Tailwind Class | Usage |
|---|---|---|---|
| `lib-purple-50` | `#F5EDF9` | `bg-lib-purple-50` | Light backgrounds, card fills, subtle surfaces |
| `lib-purple-100` | `#E8D5F3` | `bg-lib-purple-100` | Progress tracks, inactive indicators |
| `lib-purple-200` | `#D4ADE7` | `bg-lib-purple-200` | Borders, dividers, inactive bars |
| `lib-purple-300` | `#B87DD4` | `bg-lib-purple-300` | Gradient endpoints, secondary accents |
| `lib-purple-400` | `#9B5BBF` | `bg-lib-purple-400` | Mid-tones, gradient highlights |
| `lib-purple-500` | `#652D90` | `bg-lib-purple` / `bg-lib-purple-500` | **Primary brand color** |
| `lib-purple-600` | `#5A2880` | `bg-lib-purple-600` | Darker variant, hover states |
| `lib-purple-700` | `#4A2068` | `bg-lib-purple-700` | Deep dark, pressed states |
| `lib-purple-800` | `#3A1850` | `bg-lib-purple-800` | Darkest variant, dark mode gradients |
| `lib-purple-900` | `#2A1038` | `bg-lib-purple-900` | Near-black purple, dark mode backgrounds |

### Semantic Color Tokens (Light Mode)

| Token | Hex Approx | Purpose |
|---|---|---|
| `--background` | `#f2f2fa` | Page background (lavender-tinted gray) |
| `--foreground` | `#1A1A1A` | Primary text |
| `--card` | `#FFFFFF` | Card background |
| `--card-foreground` | `#1A1A1A` | Card text |
| `--primary` | `#652D90` | Brand primary (maps to Lib Purple) |
| `--primary-foreground` | `#FFFFFF` | Text on primary |
| `--secondary` | `#F5EDF9` | Light purple tint surface |
| `--secondary-foreground` | `#4A2068` | Text on secondary |
| `--muted` | `#F5EDF9` | Muted background |
| `--muted-foreground` | `#8B6B9F` | Muted text |
| `--accent` | `#F5EDF9` | Accent surface |
| `--accent-foreground` | `#4A2068` | Text on accent |
| `--destructive` | `#DC2626` | Error / destructive actions |
| `--border` | `#E8D5F3` | Default borders |
| `--input` | `#E8D5F3` | Input field borders |
| `--ring` | `#652D90` | Focus ring color |

> **Note:** The page background `#f2f2fa` is a lavender-tinted gray rather than pure white. This provides a subtle warm tone that differentiates the page surface from card surfaces (`#FFFFFF`), creating natural visual layering without relying on shadows in light mode.

### Neutral Grays

| Name | Hex | Usage |
|---|---|---|
| Gray-50 | `#f2f2fa` | Page backgrounds (light mode) — our lavender-tinted background |
| Gray-100 | `#F3F4F6` | Subtle dividers |
| Gray-200 | `#E5E7EB` | Borders, separators |
| Gray-300 | `#D1D5DB` | Disabled borders |
| Gray-400 | `#9CA3AF` | Placeholder text |
| Gray-500 | `#6B7280` | Secondary text |
| Gray-600 | `#4B5563` | Body text (muted) |
| Gray-700 | `#374151` | Secondary headings |
| Gray-800 | `#1F2937` | Primary text (dark surfaces) |
| Gray-900 | `#111827` | Card surfaces (dark mode legacy) |
| Gray-950 | `#030712` | Page background (dark mode legacy) |

> **Note:** Gray-50 has been replaced by our custom `#f2f2fa` (lavender-tinted) as the page background. In dark mode, the page background uses a deep purple (`#110a1e`) instead of pure gray-950.

### Contrast Requirements

| Text on Background | Minimum Contrast | Our Standard |
|---|---|---|
| Body text on `#f2f2fa` | 4.5:1 (WCAG AA) | `#1A1A1A` on `#f2f2fa` = **16.2:1** ✅ |
| Muted text on `#f2f2fa` | 3:1 (WCAG AA Large) | `#8B6B9F` on `#f2f2fa` = **3.5:1** ✅ |
| White text on purple | 4.5:1 | `#FFFFFF` on `#652D90` = **7.2:1** ✅ |
| Purple text on `#f2f2fa` | 4.5:1 | `#652D90` on `#f2f2fa` = **7.0:1** ✅ |

---

## 3. Corner Rounding

### Radius Scale

| Token | Value | Tailwind Class | Usage |
|---|---|---|---|
| **None** | 0px | `rounded-none` | Flat elements, dividers |
| **XS** | 4px | `rounded` | Small tags, micro-badges |
| **SM** | 8px | `rounded-lg` / `rounded-sm` | Small buttons, compact elements |
| **MD** | 10px | `rounded-md` | Default shadcn elements |
| **LG** | 12px | `rounded-xl` | Primary buttons, inputs, icon containers |
| **XL** | 16px | `rounded-2xl` | Inner card elements, book covers |
| **2XL** | 20px | `rounded-2xl` + custom | Large cards, feature panels |
| **3XL** | 24px | `rounded-3xl` | **Standard card radius**, hero sections, full-width panels |
| **Full** | 9999px | `rounded-full` | Avatars, pills, badges, FABs |

### Element-to-Radius Mapping

| Element | Radius | Rationale |
|---|---|---|
| Cards | 24px (`rounded-3xl`) | Soft, approachable feel; generous radius for modern mobile feel |
| Inner card elements | 16px (`rounded-2xl`) | One step down from parent card for visual hierarchy |
| Primary Buttons | 12px (`rounded-xl`) | Tappable, finger-friendly curves |
| Secondary Buttons | 12px (`rounded-xl`) | Consistent with primary |
| Text Inputs | 12px (`rounded-xl`) | Matches button rounding |
| Icon Containers | 12px (`rounded-xl`) | Soft square for action icons |
| Avatars | Full (`rounded-full`) | Standard identity convention |
| Tags / Pills | Full (`rounded-full`) | Infinite radius = pill shape |
| Bottom Sheets | 24px (top only) | iOS-standard sheet appearance |
| Login Header | 40px (bottom only) | Hero curve for brand impact |
| Profile Header | 32px (bottom only) | Softer curve than login |
| Book Covers | 16px (`rounded-2xl`) | Soft corners matching physical book feel |
| Modals / Dialogs | 24px (`rounded-3xl`) | Consistent with card radius |
| Toast Notifications | 12px (`rounded-xl`) | Discrete but visible |
| Progress Bars | Full (`rounded-full`) | Smooth ends |
| Divider Accents | Full (`rounded-full`) | Thin rounded bars |

> **Note:** The standard card radius is `rounded-3xl` (24px), which gives a softer, more modern feel compared to `rounded-2xl`. Inner elements within cards use `rounded-2xl` (16px) for visual hierarchy.

---

## 4. Spacing System

### Base Unit: 4px

All spacing values are multiples of 4px, following the 4px grid system.

### Spacing Scale

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| **0** | 0px | `0` | No spacing |
| **0.5** | 2px | `0.5` | Hairline gaps |
| **1** | 4px | `1` | Tight spacing, inline gaps |
| **1.5** | 6px | `1.5` | Compact list items |
| **2** | 8px | `2` | Grid gaps, tight padding |
| **3** | 12px | `3` | Small section gaps |
| **4** | 16px | `4` | **Standard padding**, page margins |
| **5** | 20px | `5` | Section gaps, list spacing |
| **6** | 24px | `6` | Generous padding, card content |
| **8** | 32px | `8` | Large section separators |
| **10** | 40px | `10` | Major layout breaks |
| **12** | 48px | `12` | Hero spacing, large vertical gaps |
| **16** | 64px | `16` | Full-bleed separators |
| **20** | 80px | `20` | Bottom safe area for navigation |

### Layout Spacing Patterns

| Context | Horizontal | Vertical | Notes |
|---|---|---|---|
| **Page padding** | 16px (`px-4`) | 16px (`py-4`) | Consistent screen edge padding |
| **Card padding** | 16px (`p-4`) or 24px (`p-6`) | Same | Content density determines size |
| **Section gap** | — | 20px (`space-y-5`) | Between major sections |
| **Card gap** | — | 12px (`space-y-3`) | Between cards in a list |
| **Form field gap** | — | 16px (`space-y-4`) | Between input fields |
| **List item padding** | 16px (`px-4`) | 14px (`py-3.5`) | Comfortable tappable area |
| **Bottom nav height** | — | 80px (`h-20`) | Includes safe area |
| **Horizontal list** | 12px (`gap-3`) | — | Book carousels, tag lists |

### Internal Spacing Rules

| Pattern | Formula | Example |
|---|---|---|
| **Icon + Text** | 8px gap | `gap-2` between icon and label |
| **Button padding** | 16px horizontal, 12px vertical | `px-4 py-3` for touch-friendly area |
| **Input padding** | 12px horizontal | `px-3` inside text fields |
| **Card stack offset** | -24px to -48px overlap | `-mt-6` to `-mt-12` for layered cards |
| **Badge inset** | 4px from edge | Avatar badge positioning |
| **Avatar overlap** | -8px margin | `-ml-2` for stacked avatars |

---

## 5. Elevation & Shadows

### Design Philosophy: Flat Light, Depth Dark

> **Major Design Principle:** Light mode is **FLAT** — no shadows on cards, buttons, images, or modals. Visual separation comes from the contrast between the lavender-tinted page background (`#f2f2fa`) and white card surfaces (`#FFFFFF`). Dark mode uses shadows for depth and layer differentiation since the dark purple surfaces need additional visual cues.

- **Light mode:** Cards are flat at rest. No `shadow-sm`, no `shadow-md`, no `shadow-lg` on content surfaces. Only `BottomNav` and the QR scan center button retain shadows in both light and dark mode.
- **Dark mode:** Shadows are used for depth. Cards get `dark:shadow-sm`, hover states add `dark:shadow-md`, and the mobile container uses `dark:shadow-xl`.

### Shadow Hierarchy

| Level | Shadow Value | Tailwind | Light Mode | Dark Mode | Usage |
|---|---|---|---|---|---|
| **0 — Flat** | none | `shadow-none` | ✅ Default | — | Cards at rest, inline elements, text |
| **1 — Subtle** | `0 1px 2px rgba(0,0,0,0.05)` | `shadow-sm` | ❌ Not used | ✅ `dark:shadow-sm` | Cards at rest (dark mode only) |
| **2 — Default** | `0 4px 6px -1px rgba(0,0,0,0.1)` | `shadow` | ❌ Not used | ✅ `dark:shadow` | Elevated cards (dark mode only) |
| **3 — Medium** | `0 8px 25px -5px rgba(101,45,144,0.15), 0 4px 10px -3px rgba(101,45,144,0.08)` | Custom | ❌ Not used | ✅ Dark mode hover | Card hover state (dark mode only) |
| **4 — High** | `0 10px 15px -3px rgba(0,0,0,0.1)` | `shadow-lg` | ✅ BottomNav + QR scan only | ✅ FABs, elevated buttons | Bottom nav card, scan button |
| **5 — Brand Glow** | `0 0 20px 4px rgba(101,45,144,0.35), 0 4px 14px -2px rgba(101,45,144,0.25)` | Custom | ❌ Not used | ✅ Dark mode only | Primary CTA glow (dark mode only) |
| **6 — Hero** | `0 20px 25px -5px rgba(0,0,0,0.1)` | `shadow-xl` | ❌ Not used | ✅ `dark:shadow-xl` | Mobile container (dark mode only) |

### Elements with Shadows in BOTH Light and Dark Mode

| Element | Shadow | Rationale |
|---|---|---|
| **BottomNav card** | `shadow-sm` | Needs to feel elevated above page content at all times |
| **QR scan center button** | `shadow-sm` + `shadow-lib-purple/40` | Floating action button must always appear raised |

### Brand Shadow (Purple-tinted) — Dark Mode Only

For elements that need to feel "part of the brand" rather than just elevated. These only apply in dark mode:

| State | Shadow | Mode |
|---|---|---|
| **Hover** | `0 8px 25px -5px rgba(101,45,144,0.25), 0 4px 10px -3px rgba(101,45,144,0.15)` | Dark only |
| **Lift** | `0 4px 12px -2px rgba(101,45,144,0.12)` | Dark only |
| **Focus Ring** | `0 0 0 2px rgba(101,45,144,0.2)` | Dark only |
| **Glow** | `0 0 20px 4px rgba(101,45,144,0.35)` | Dark only |

### CSS Utility Classes

The following global CSS classes apply box-shadow **only in `.dark` context**:

| Class | Effect | Dark Mode Shadow |
|---|---|---|
| `.card-hover-effect:hover` | translateY(-2px) | `0 8px 25px -5px rgba(101,45,144,0.25), 0 4px 10px -3px rgba(101,45,144,0.15)` |
| `.hover-lift:hover` | translateY(-1px) | `0 4px 12px -2px rgba(101,45,144,0.12)` |
| `.glass-card` | Frosted glass effect | `rgba(35, 20, 60, 0.75)` background |
| `.press-effect:active` | scale(0.97) | `0 1px 4px rgba(101,45,144,0.1)` |

### Elevation Rules

1. **Light mode resting state:** Cards use NO shadow — flat design. Visual separation comes from background color contrast (`#f2f2fa` page vs `#FFFFFF` card).
2. **Dark mode resting state:** Cards use `dark:shadow-sm` — subtle depth for surface differentiation.
3. **Interaction (dark mode only):** Hover/tap adds brand-tinted shadow — purple glow reinforces brand.
4. **BottomNav + QR scan:** These elements retain shadows in BOTH modes because they float above content and need persistent elevation cues.
5. **Primary CTA glow:** Only appears in dark mode when valid/active — draws the eye without competing with flat light mode.
6. **Mobile container:** Uses `dark:shadow-xl` for the 430px container — no shadow in light mode.
7. **Never use pure black shadows** — always tint with brand purple or use gray.
8. **Light mode rule of thumb:** If it's not BottomNav or QR scan, it doesn't get a shadow.

---

## 6. Gradients

### Brand Gradients

| Name | Value (Light) | Value (Dark) | Usage |
|---|---|---|---|
| **Purple Gradient** | `linear-gradient(135deg, #652D90 0%, #7B3FA8 50%, #9B5BBF 100%)` | `linear-gradient(135deg, #522575 0%, #5A2880 50%, #7B3FA8 100%)` | Primary buttons, headers, CTAs |
| **Subtle Purple** | `linear-gradient(135deg, #F5EDF9 0%, #E8D5F3 100%)` | `linear-gradient(135deg, #2A1038 0%, #3A1850 100%)` | Backgrounds, card fills |
| **Text Gradient** | `linear-gradient(135deg, #652D90, #9B5BBF)` | Same | Gradient text effect (clip) |
| **Border Gradient** | `linear-gradient(135deg, #652D90, #9B5BBF, #B87DD4, #652D90)` | Same | Animated gradient borders |
| **CTA Gradient** | `linear-gradient(to right, #652D90, #7B3FA8, #652D90)` | Same | Final onboarding CTA |

### Gradient Rules

1. **Direction:** Always 135deg (top-left to bottom-right) for brand gradients
2. **Stops:** 3-stop minimum for smooth purple gradients
3. **Dark mode:** Shift stops darker by ~20% lightness
4. **Subtle gradients:** Only 2 stops, low contrast between them
5. **Never use non-purple gradients** for primary elements

---

## 7. Iconography

### Icon Library

| Property | Value |
|---|---|
| **Library** | Lucide React |
| **Style** | Outlined (stroke-based) |
| **Default Stroke** | 1.5px (Lucide default) |
| **Color** | Inherits from parent (`currentColor`) |

### Icon Size Scale

| Size | Dimensions | Usage |
|---|---|---|
| **XS** | 14px | Inline with small text, badges |
| **SM** | 16px | Inline with body text, list items |
| **MD** | 20px | Navigation, standard actions |
| **LG** | 24px | Section headers, prominent actions |
| **XL** | 28px | Feature highlights |
| **2XL** | 32px | Empty states, illustrations |

### Icon Container Sizes

| Container | Size | Icon | Background | Radius |
|---|---|---|---|---|
| **Small** | 36×36px (`w-9 h-9`) | 18px | `bg-card dark:shadow-sm` | 12px (`rounded-xl`) |
| **Medium** | 40×40px (`w-10 h-10`) | 20px | `bg-card dark:shadow-sm` | 12px (`rounded-xl`) |
| **Large** | 44×44px (`w-11 h-11`) | 22px | `bg-card dark:shadow-sm` | 12px (`rounded-xl`) |
| **XL** | 48×48px (`w-12 h-12`) | 24px | `bg-card dark:shadow-sm` | 12px (`rounded-xl`) |

> **Note:** Icon containers (bell, settings, etc.) use `bg-card dark:shadow-sm` squircle containers. They have no shadow in light mode and a subtle shadow in dark mode.

### Icon Color Rules

| Context | Color | Example |
|---|---|---|
| **Default** | `text-lib-purple` | Navigation, actions |
| **On purple bg** | `text-white` | Purple button icons |
| **Muted/Inactive** | `text-lib-purple-300` | Disabled, inactive tabs |
| **Destructive** | `text-red-500` | Delete, remove |
| **Success** | `text-green-600` | Check, confirm |

---

## 8. Motion & Animation

### Duration Scale

| Speed | Duration | Easing | Usage |
|---|---|---|---|
| **Instant** | 100ms | ease-out | Color changes, opacity |
| **Quick** | 200ms | ease-in-out | Button press, toggle |
| **Standard** | 300ms | ease-in-out | Screen transitions, expand |
| **Expressive** | 500ms | ease-out | Sheet presentation, hero animations |
| **Deliberate** | 800ms | ease-in-out | Onboarding transitions |

### Standard Transitions

| Animation | Properties | Duration | Easing |
|---|---|---|---|
| **Screen Enter** | opacity: 0→1, y: +8→0 | 200ms | easeInOut |
| **Card Hover** | translateY: 0→-2px, dark:shadow | 200ms | easeOut |
| **Button Press** | scale: 1→0.97 | 100ms | easeOut |
| **Modal Enter** | opacity: 0→1, scale: 0.95→1 | 300ms | easeOut |
| **Sheet Enter** | translateY: 100%→0 | 300ms | easeOut |
| **Toast Enter** | translateY: -20→0, opacity | 300ms | easeOut |
| **Skeleton Shimmer** | background-position | 1.5s | linear (infinite) |
| **Progress Fill** | width | 500ms | easeInOut |
| **Confetti** | Multi-particle physics | 3s | easeOut |

### Micro-interactions

| Element | Trigger | Animation |
|---|---|---|
| **Heart / Favorite** | Tap | Scale 1→1.3→1 (300ms bounce) + color fill |
| **Scan Button** | Tap | Scale 1→0.9→1 + ripple |
| **Toggle** | Switch | Slide + color fade (200ms) |
| **Pull to Refresh** | Pull | Rotation + progress indicator |
| **Badge Notification** | New item | Scale 0→1.2→1 (spring) + glow |

### Animation Rules

1. **Never animate layout properties** (width, height, top, left) — use `transform` instead
2. **Prefer Framer Motion** for component-level orchestration
3. **CSS keyframes** for simple repeating animations (shimmer, pulse, spin)
4. **Reduce motion** — always respect `prefers-reduced-motion`
5. **No animation should block interaction** — 300ms max for interactive feedback

---

## 9. Layout & Grid

### Container

| Property | Value |
|---|---|
| **Max Width** | 430px |
| **Centering** | `mx-auto` |
| **Shadow** | `dark:shadow-xl` (dark mode only; no shadow in light mode) |
| **Min Height** | `100vh` / `100dvh` |

> **Note:** The mobile container uses `dark:shadow-xl` instead of `shadow-xl`. In light mode, the container has no shadow — visual separation comes from the lavender-tinted background. In dark mode, the shadow provides depth against the dark purple page.

### Grid System

| Context | Columns | Gap | Notes |
|---|---|---|---|
| **Stats Row** | 3 | 12px (`gap-3`) | Number + label cards |
| **2-column cards** | 2 | 12px (`gap-3`) | Square cards (e.g. Attendance Analytics + Reading Goal) |
| **Book Carousel** | Auto | 12px (`gap-3`) | Horizontal scroll |
| **Tag List** | Auto | 8px (`gap-2`) | Flex wrap |

### Safe Areas

| Area | Value | Tailwind | Notes |
|---|---|---|---|
| **Top** | env(safe-area-inset-top) | `pt-safe` | Status bar |
| **Bottom** | env(safe-area-inset-bottom) | `pb-safe` | Home indicator |
| **Bottom Nav** | 80px total height | `h-20` | Includes safe area |
| **Content bottom padding** | 80px | `pb-20` | Prevents nav overlap |

---

## 10. Touch Targets & Accessibility

### Minimum Touch Targets (Apple HIG)

| Element | Min Size | Recommended |
|---|---|---|
| **Buttons** | 44×44px | 48×48px (`h-12`) |
| **List items** | 44×44px | Full-width + `py-3.5` |
| **Icon buttons** | 44×44px | Container `w-11 h-11` |
| **Links** | 44×44px tap area | Can be smaller visually |
| **Inputs** | 44px height | 48px (`h-12`) for primary |

### Accessibility Requirements

| Requirement | Standard | Implementation |
|---|---|---|
| **Contrast Ratio** | WCAG AA 4.5:1 | All text passes ✅ |
| **Focus Indicators** | Visible ring | `ring-2 ring-lib-purple/20` |
| **Screen Reader** | Semantic HTML + ARIA | `role`, `aria-label`, `aria-live` |
| **Motion** | Respect prefers-reduced-motion | `@media (prefers-reduced-motion)` |
| **Color Independence** | Never color-only info | Always pair with icon/text |

---

## 11. Dark Mode Guidelines

### Dark Mode Philosophy

Dark mode is not "invert colors" — it's a carefully crafted **dark purple** surface system that maintains the brand identity while reducing eye strain. The system uses a deep purple base instead of pure dark gray, creating a distinctive and cohesive dark experience.

### Surface Hierarchy (Dark Mode)

| Level | Background | CSS Variable / Class | Usage |
|---|---|---|---|
| **L0 — Page** | `#110a1e` (deep purple-black) | `--background: oklch(0.13 0.04 300)` | Deepest background |
| **L1 — Card** | Dark purple surface | `--card: oklch(0.18 0.05 300)` | Content surfaces |
| **L2 — Elevated** | `dark:bg-white/10` | Transparency-based | Interactive elements, hover |
| **L3 — Overlay** | `dark:bg-white/15` | Transparency-based | Modals over content |
| **L4 — Subtle** | `dark:bg-white/5` | Transparency-based | Subtle backgrounds, icon containers |

> **Key Change:** The dark mode surface system uses **transparency over dark purple** (`dark:bg-white/5`, `dark:bg-white/10`, `dark:bg-white/15`) instead of opaque gray surfaces (`dark:bg-gray-900`, `dark:bg-gray-800`). This allows the purple base to show through all surfaces, creating a cohesive dark purple aesthetic.

### Color Adaptation Rules

| Light Mode | Dark Mode | Reason |
|---|---|---|
| `#f2f2fa` page bg | `#110a1e` (deep purple-black) | Lavender-tinted → deep purple base |
| `#FFFFFF` card bg | `bg-card` (`oklch(0.18 0.05 300)`) | White → dark purple surface |
| `bg-lib-purple-50` surfaces | `dark:bg-white/5` | Subtle purple → transparent over dark purple |
| `bg-gray-100` surfaces | `dark:bg-white/10` | Light gray → translucent overlay |
| `border-gray-200` borders | `dark:border-white/5` or `dark:border-white/10` | Visible but not harsh |
| `text-gray-500` muted | `text-gray-400` | Slightly brighter for readability |
| `shadow-sm` (light mode: none) | `dark:shadow-sm` | Shadows are dark-mode-only for depth |
| Purple gradients | Darker stops (-20% lightness) | Prevents glowing effect |
| `bg-white` icons/containers | `dark:bg-white/10` with `dark:shadow-sm` | Translucent with subtle depth |

### Dark Mode Specific Elements

| Element | Treatment |
|---|---|
| **Brand gradient** | Use darker stops: `#522575 → #5A2880 → #7B3FA8` |
| **Cards** | `bg-card` with `dark:shadow-sm`; no border needed (shadow provides definition) |
| **Bottom Navigation** | `dark:bg-[#1a0e2e]/90` with `dark:border-white/5` |
| **Inputs** | `dark:bg-white/10 border-white/5` with white text |
| **Shadows** | Applied in dark mode only via `dark:shadow-*` classes |
| **Images** | Consider slight dimming (`opacity-90`) |
| **Password modal** | `dark:bg-[#1a0e2e]` |
| **Glass effects** | `dark:bg-[rgba(35,20,60,0.75)]` with dark purple tint |

### oklch Hue Shift

The dark mode CSS variables use oklch with hue **300** (purple) instead of **0** (achromatic). This gives all dark surfaces a subtle purple undertone:

- `--background: oklch(0.13 0.04 300)` — deep purple-black
- `--card: oklch(0.18 0.05 300)` — dark purple surface
- `--primary: oklch(0.55 0.2 300)` — vivid purple accent

---

## 12. Component Specifications

### Buttons

| Variant | Height | Padding | Radius | Font | Background |
|---|---|---|---|---|---|
| **Primary** | 48px (`h-12`) | `px-6` | 12px (`rounded-xl`) | 16px semibold | `bg-purple-gradient` |
| **Secondary** | 44px (`h-11`) | `px-4` | 12px (`rounded-xl`) | 14px medium | `bg-lib-purple-50 text-lib-purple` |
| **Outline** | 44px (`h-11`) | `px-4` | 12px (`rounded-xl`) | 14px medium | `border-lib-purple text-lib-purple` |
| **Ghost** | 44px (`h-11`) | `px-4` | 12px (`rounded-xl`) | 14px medium | transparent |
| **Destructive** | 44px (`h-11`) | `px-4` | 12px (`rounded-xl`) | 14px medium | `bg-red-50 border-red-200 text-red-600` |
| **Icon** | 44×44px | — | 12px (`rounded-xl`) | — | `bg-card dark:shadow-sm` |
| **FAB** | 56×56px | — | Full | — | `bg-lib-purple` + `dark:shadow-lg` |

### Cards

| Type | Padding | Radius | Shadow | Border |
|---|---|---|---|---|
| **Standard** | 16px (`p-4`) | 24px (`rounded-3xl`) | `dark:shadow-sm` (flat in light) | `border-gray-100 dark:border-white/5` |
| **Spacious** | 24px (`p-6`) | 24px (`rounded-3xl`) | `dark:shadow-sm` (flat in light) | `border-gray-100 dark:border-white/5` |
| **Interactive** | 16px | 24px (`rounded-3xl`) | `dark:shadow-sm` → `dark:shadow-md` on hover | Same |
| **Stat** | 16px | 24px (`rounded-3xl`) | `dark:shadow-sm` (flat in light) | Same |

> **Note:** Cards are flat (no shadow) in light mode. The lavender-tinted page background (`#f2f2fa`) provides natural separation from white card surfaces. In dark mode, `dark:shadow-sm` provides depth on the dark purple surfaces.

### Input Fields

| Property | Value |
|---|---|
| **Height** | 44-48px (`h-11` to `h-12`) |
| **Radius** | 12px (`rounded-xl`) |
| **Padding** | 12px horizontal (`px-3`) |
| **Border** | 1px `border-gray-200` → `ring-lib-purple` on focus |
| **Font** | 16px regular (prevents iOS zoom) |
| **Label** | 12px medium `text-lib-purple` above input |
| **Error** | 12px regular `text-red-500` below input |
| **Placeholder** | `text-gray-400` |

### Bottom Navigation

| Property | Value |
|---|---|
| **Height** | 80px total (`h-20`) |
| **Padding** | `pt-2 pb-2 px-2` |
| **Background** | `bg-card shadow-sm` (retains shadow in both light and dark mode) |
| **Border** | `border-t border-gray-100 dark:border-white/5` |
| **Active icon** | `text-white` (on `bg-lib-purple` pill) |
| **Inactive icon** | `text-muted-foreground` |
| **Active label** | 8px semibold `text-white` (on purple pill) |
| **Inactive label** | 8px medium `text-muted-foreground` |
| **Center scan button** | 52px `rounded-2xl`, `bg-purple-gradient`, `shadow-sm shadow-lib-purple/40` (retains shadow in both modes) |
| **Dark mode** | `dark:bg-[#1a0e2e]/90` with `dark:border-white/5` |

> **Note:** The BottomNav is one of only two components that retain shadows in light mode (the other being the QR scan center button). This ensures it always feels elevated above content.

### Home Screen — Streak Card

| Property | Value |
|---|---|
| **Background** | `bg-orange-400 dark:bg-orange-500` |
| **Radius** | Full (`rounded-full`) — pill shape |
| **Padding** | `px-3.5 py-2` |
| **Icon** | Flame (white) |
| **Text** | White, bold streak count |

### Home Screen — Greeting

| Property | Value |
|---|---|
| **Style** | Split weight: "Good afternoon," is regular weight, "Juan!" is bold |
| **Size** | `text-2xl` |
| **Tracking** | `tracking-tight` |

---

## 13. Status & Semantic Colors

### Status Colors

| Status | Background | Text | Icon | Usage |
|---|---|---|---|---|
| **Success** | `bg-green-50` | `text-green-700` | ✓ CheckCircle | Returned, completed |
| **Success (dark)** | `bg-green-900/20` | `text-green-400` | Same | Dark mode |
| **Warning** | `bg-yellow-100` | `text-yellow-700` | ⚠ AlertTriangle | Due soon, pending |
| **Warning (dark)** | `bg-yellow-900/30` | `text-yellow-400` | Same | Dark mode |
| **Error / Overdue** | `bg-red-100` | `text-red-700` | ✕ AlertCircle | Overdue, failed |
| **Error (dark)** | `bg-red-900/30` | `text-red-400` | Same | Dark mode |
| **Info** | `bg-lib-purple-50` | `text-lib-purple` | ⓘ Info | Informational |
| **Info (dark)** | `bg-lib-purple-900/30` | `text-lib-purple-300` | Same | Dark mode |

### Chart Colors

| Index | Color | Usage |
|---|---|---|
| Chart-1 | `#652D90` (Primary purple) | Primary data series |
| Chart-2 | `#0D9488` (Teal) | Secondary data |
| Chart-3 | `#2563EB` (Blue) | Tertiary data |
| Chart-4 | `#EAB308` (Yellow) | Quaternary data |
| Chart-5 | `#EA580C` (Orange) | Quinary data |

---

## 14. Imagery & Photography

### Book Covers

| Property | Value |
|---|---|
| **Aspect Ratio** | 2:3 (standard book) |
| **Radius** | 16px (`rounded-2xl`) |
| **Shadow** | `dark:shadow-sm` (flat in light mode) |
| **Hover Shadow** | `group-hover:dark:shadow-md` (dark mode only) |
| **Placeholder** | Gradient background + book icon |
| **Loading** | Skeleton shimmer |
| **AI-generated covers** | 10 covers in `/public/covers/` |

> **Note:** Book covers use `rounded-2xl` (16px) for their corner radius, and `dark:shadow-sm` for their shadow treatment. In light mode, covers are completely flat (no shadow). On hover in dark mode, they get `group-hover:dark:shadow-md`.

### Avatars

| Size | Dimensions | Radius | Usage |
|---|---|---|---|
| **SM** | 32px (`w-8 h-8`) | Full | List items |
| **MD** | 40px (`w-10 h-10`) | Full | Cards, comments |
| **LG** | 64px (`w-16 h-16`) | Full | Profile header |
| **XL** | 80px (`w-20 h-20`) | Full | Profile hero |

### Image Treatment

| Treatment | Value |
|---|---|
| **Loading** | Skeleton shimmer animation |
| **Error** | Gradient placeholder + icon |
| **Dark mode** | Slight opacity reduction (`opacity-90`) |
| **Overlays** | Semi-transparent gradient for text on images |

---

## 15. Writing & Tone

### Voice

| Attribute | Description |
|---|---|
| **Tone** | Friendly, academic, encouraging |
| **Formality** | Semi-formal (not stuffy, not casual) |
| **Person** | First-person plural ("we") for system, second-person ("you") for user |
| **Jargon** | Minimal — explain library terms when used |

### Copy Length Guidelines

| Context | Max Length | Example |
|---|---|---|
| **Button labels** | 2 words | "Borrow Book", "Return" |
| **Nav labels** | 1 word | "Home", "Search", "Profile" |
| **Section titles** | 3 words | "Recently Added", "My Borrowed" |
| **Card titles** | 5 words | "Introduction to Algorithms" |
| **Body text** | 2 lines | Brief description in cards |
| **Error messages** | 1 line | "Please enter a valid email" |
| **Success messages** | 1 line | "Book returned successfully!" |
| **Empty states** | Title + 1 line | "No books borrowed yet / Start exploring the library" |

### Number Formatting

| Type | Format | Example |
|---|---|---|
| **Dates** | MMM DD, YYYY | Jan 15, 2025 |
| **Time** | h:mm AM/PM | 2:30 PM |
| **Relative time** | Smart units | "2h ago", "Yesterday", "Jan 10" |
| **Count** | Compact for 1000+ | "1.2k books" |
| **Currency** | Symbol + amount | ₱150.00 |
| **Rating** | 1 decimal | 4.5 ★ |

---

## 16. Implementation Reference

### Tailwind Theme Extensions

The following custom values are defined in `globals.css` under `@theme inline`:

```css
@theme inline {
  --color-lib-purple: #652D90;
  --color-lib-purple-light: #7B3FA8;
  --color-lib-purple-dark: #522575;
  --color-lib-purple-50: #F5EDF9;
  --color-lib-purple-100: #E8D5F3;
  --color-lib-purple-200: #D4ADE7;
  --color-lib-purple-300: #B87DD4;
  --color-lib-purple-400: #9B5BBF;
  --color-lib-purple-500: #652D90;
  --color-lib-purple-600: #5A2880;
  --color-lib-purple-700: #4A2068;
  --color-lib-purple-800: #3A1850;
  --color-lib-purple-900: #2A1038;
  --radius: 0.75rem;
}
```

### CSS Custom Properties (shadcn/ui)

All shadcn semantic tokens are defined with oklch values and automatically adapt to dark mode via `.dark` class. In dark mode, the hue is shifted to 300 (purple) for a cohesive dark purple aesthetic.

### Quick Reference: Class Mapping

| Design Token | Tailwind Class |
|---|---|
| Primary background | `bg-lib-purple` |
| Primary text | `text-lib-purple` |
| Light surface | `bg-lib-purple-50` |
| Gradient button | `bg-purple-gradient` |
| Card | `rounded-3xl dark:shadow-sm p-4` |
| Primary button | `h-12 rounded-xl bg-purple-gradient text-white font-semibold` |
| Input | `h-11 rounded-xl border-gray-200 px-3` |
| Section gap | `space-y-5` |
| Page padding | `px-4 py-4` |
| Card inner element | `rounded-2xl` |
| Icon container | `rounded-xl bg-card dark:shadow-sm` |
| Dark surface | `dark:bg-white/5` / `dark:bg-white/10` / `dark:bg-white/15` |
| Dark border | `dark:border-white/5` / `dark:border-white/10` |
| Container shadow | `dark:shadow-xl` (no shadow in light) |

---

## Changelog

| Date | Version | Changes |
|---|---|---|
| 2026-03-04 | 1.1 | **Major update:** Light mode page background changed to `#f2f2fa` (lavender-tinted gray). Shadow system overhauled — light mode is now completely flat (no shadows on cards, buttons, images, modals), shadows only appear in dark mode via `dark:shadow-*`. BottomNav and QR scan button are exceptions that retain shadows in both modes. Card corner radius updated from `rounded-2xl` (16px) to `rounded-3xl` (24px); inner card elements use `rounded-2xl` (16px). Dark mode redesigned with dark purple base (`#110a1e`) instead of pure dark gray, using transparency system (`dark:bg-white/5`, `dark:bg-white/10`, `dark:bg-white/15`) and oklch hue 300. Book covers updated to `rounded-2xl` with `dark:shadow-sm`. Home screen: streak card is orange pill (`bg-orange-400 dark:bg-orange-500`), greeting uses split weight (regular + bold), bell/settings icons in `bg-card dark:shadow-sm` squircle containers, Quick Actions section removed, 2-column square cards added. CSS utility classes (`.card-hover-effect`, `.hover-lift`, `.glass-card`, `.press-effect`) updated to apply box-shadow only in `.dark` context. Container shadow changed from `shadow-xl` to `dark:shadow-xl`. |
| 2025-01-27 | 1.0 | Initial branding guide created — typography, colors, spacing, corners, shadows, gradients, icons, motion, layout, accessibility, dark mode, components, status colors, imagery, writing tone |

---

> **This document is the single source of truth for LibLog's visual design system.** All UI decisions should reference this guide. When in doubt, default to Apple Human Interface Guidelines and apply the purple brand tint.
