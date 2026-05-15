/**
 * types/index.ts
 * --------------
 * Centralized TypeScript interfaces for the LibLog mobile app.
 * Institution: Calauan Community College (CCC)
 *
 * These types mirror the desktop definitions for shared Supabase entities.
 * Mobile-specific types (e.g. QR scan payloads) will be added as features
 * are implemented.
 */

// ─── Enums ───────────────────────────────────────────────────────────────────
export type UserRole = "STUDENT" | "FACULTY" | "VISITOR" | "LIBRARIAN";
export type ResourceStatus =
  | "AVAILABLE"
  | "BORROWED"
  | "DONATED"
  | "MAINTENANCE";
export type BorrowStatus = "ACTIVE" | "RETURNED" | "OVERDUE";

// ─── Patron ───────────────────────────────────────────────────────────────────
export interface Patron {
  id: string;
  university_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  program: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Resource ─────────────────────────────────────────────────────────────────
export interface Resource {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  category: string;
  total_copies: number;
  available_copies: number;
  status: ResourceStatus;
  created_at: string;
  updated_at: string;
}

// ─── BorrowRecord ─────────────────────────────────────────────────────────────
export interface BorrowRecord {
  id: string;
  patron_id: string;
  resource_id: string;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
  status: BorrowStatus;
  paid_fine_amount: number;
  created_at: string;
}

// ─── AttendanceLog ────────────────────────────────────────────────────────────
export interface AttendanceLog {
  id: string;
  patron_id: string;
  date: string;
  time_in: string;
  time_out: string | null;
  duration_minutes: number | null;
  created_at: string;
}

// ─── Auth (Zustand Store) ──────────────────────────────────────────────────────
import type { Session, User } from "@supabase/supabase-js";
export type { Session, User };

export interface AuthState {
  session: Session | null;
  isInitialized: boolean;
}

export interface AuthActions {
  setSession: (session: Session | null) => void;
  setInitialized: () => void;
  signOut: () => Promise<void>;
}

export type AuthStore = AuthState & AuthActions;
