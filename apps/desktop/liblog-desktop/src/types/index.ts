/**
 * types/index.ts
 * --------------
 * Centralized TypeScript interfaces for the LibLog system (v1.0 Schema).
 * Institution: Calauan Community College (CCC)
 */

// ─── Enums ───────────────────────────────────────────────────────────────────
export type UserRole = 'STUDENT' | 'FACULTY' | 'VISITOR' | 'LIBRARIAN';
export type ResourceStatus = 'AVAILABLE' | 'BORROWED' | 'DONATED' | 'MAINTENANCE';
export type BorrowStatus = 'ACTIVE' | 'RETURNED' | 'OVERDUE';

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

export type NewPatron = Pick<Patron, 'university_id' | 'full_name' | 'email' | 'role' | 'program'>;

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

export type NewResource = Omit<Resource, 'id' | 'created_at' | 'updated_at'>;

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

export interface BorrowRecordWithRelations extends BorrowRecord {
  resources: Pick<Resource, 'title' | 'author' | 'isbn' | 'available_copies'> | null;
  patrons: Pick<Patron, 'full_name' | 'university_id' | 'role'> | null;
}

export type NewBorrowRecord = Pick<BorrowRecord, 'patron_id' | 'resource_id' | 'due_date'>;

// ─── AttendanceLog ────────────────────────────────────────────────────────────
export interface AttendanceLog {
  id: string;
  patron_id: string;
  date: string;
  time_in: string;
  time_out: string | null;
  duration_minutes: number | null;
  created_at: string;
  patrons: Pick<Patron, 'full_name' | 'role' | 'university_id' | 'program'> | null;
}

// ─── AdminAction ──────────────────────────────────────────────────────────────
export interface AdminAction {
  id: string;
  librarian_id: string;
  action_type: string;
  target_record_id: string;
  description: string | null;
  created_at: string;
}

// ─── Auth (Zustand Store) ──────────────────────────────────────────────────────
import type { Session, User } from '@supabase/supabase-js';
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
