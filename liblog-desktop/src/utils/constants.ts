/**
 * constants.ts
 * ------------
 * Single source of truth for all design tokens and configuration constants
 * used across the LibLog Librarian Dashboard.
 * Institution: Calauan Community College (CCC)
 *
 * DRY Principle: All values are defined ONCE here. Never hardcode these
 * values inside components — always import from this file.
 *
 * Color naming: CCC_* prefix for institutional brand colors.
 * UI_*  prefix for generic UI palette (backgrounds, borders, text).
 */

// ─── Institutional Branding ───────────────────────────────────────────────────
/** CCC Purple — primary institutional brand color. Used on all interactive
 *  elements, active states, borders, and accent indicators. */
export const CCC_PURPLE          = '#652D90';

/** CCC Purple as an RGB tuple for jsPDF (requires number arrays, not hex). */
export const CCC_PURPLE_RGB: [number, number, number] = [101, 45, 144];

/** Slightly darker purple for secondary accents (hover states, depth). */
export const CCC_PURPLE_DARK     = '#4A1F6E';

/** Lighter purple for hover/active backgrounds, table header fills. */
export const CCC_PURPLE_LIGHT    = '#8B4DBF';

/** Very light purple tint for table row backgrounds and surface fills. */
export const CCC_PURPLE_TINT     = '#f3e8ff';

/** Even lighter tint for zebra striping and section backgrounds. */
export const CCC_PURPLE_TINT_ALT = '#faf5ff';

// ─── Auth Screen Gradient ─────────────────────────────────────────────────────
/** Deep dark purple — used as the auth/loading screen background start. */
export const CCC_AUTH_BG_START   = '#1E1030';

/** Mid dark purple — used as the auth/loading screen background end. */
export const CCC_AUTH_BG_END     = '#2D1A4A';

// ─── Semantic Status Colors ───────────────────────────────────────────────────
export const COLOR_SUCCESS        = '#16a34a';
export const COLOR_SUCCESS_BG     = '#dcfce7';
export const COLOR_WARNING        = '#d97706';
export const COLOR_WARNING_BG     = '#fef3c7';
export const COLOR_DANGER         = '#ef4444';
export const COLOR_DANGER_BG      = '#fef2f2';
export const COLOR_NEUTRAL        = '#6b7280';
export const COLOR_NEUTRAL_BG     = '#f3f4f6';

// ─── Patron Type Colors ───────────────────────────────────────────────────────
export const PATRON_COLORS = {
  student: { bg: '#eff6ff', color: '#3b82f6' },
  faculty: { bg: '#f0fdf4', color: '#16a34a' },
  visitor: { bg: '#fff7ed', color: '#ea580c' },
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
export const FONT_FAMILY         = "'Inter', system-ui, sans-serif";

// ─── Spacing & Layout ─────────────────────────────────────────────────────────
export const BORDER_RADIUS_SM    = '8px';
export const BORDER_RADIUS_MD    = '12px';
export const BORDER_RADIUS_LG    = '16px';
export const BORDER_RADIUS_XL    = '20px';

// ─── Institution Info (used in PDF headers) ───────────────────────────────────
export const INSTITUTION_NAME    = 'Calauan Community College';
export const INSTITUTION_SYSTEM  = 'Library Usage Report — LibLog System';

// ─── React Query Defaults ─────────────────────────────────────────────────────
/** 30 seconds — balanced for slow/unstable campus networks. */
export const QUERY_STALE_TIME    = 1000 * 30;

/** Number of retries before React Query marks a query as failed. */
export const QUERY_RETRY_COUNT   = 2;

// ─── Database Programs ────────────────────────────────────────────────────────
/** Mirrors the `programs` table in Supabase. Add new programs here when
 *  the DB is updated, to keep the ReportGenerator dropdown in sync. */
export const DB_PROGRAMS = [
  { id: '',  label: 'All Programs' },
  { id: '1', label: 'BSPA — Bachelor of Science in Public Administration' },
  { id: '2', label: 'MID — Midwifery' },
] as const;

export const DB_PATRON_TYPES = [
  { value: '',         label: 'All Types' },
  { value: 'student',  label: 'Students'  },
  { value: 'faculty',  label: 'Faculty'   },
  { value: 'visitor',  label: 'Visitors'  },
] as const;
