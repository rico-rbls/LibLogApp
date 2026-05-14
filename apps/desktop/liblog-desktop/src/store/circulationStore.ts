import { create } from 'zustand';
import type { Patron, BorrowRecordWithRelations } from '../types';

interface CirculationState {
  isScanning: boolean;
  scannedPatron: Patron | null;
  activeLoans: BorrowRecordWithRelations[];
  setScanning: (isScanning: boolean) => void;
  simulateScan: () => void;
  clearScan: () => void;
}

export const useCirculationStore = create<CirculationState>((set) => ({
  isScanning: false,
  scannedPatron: null,
  activeLoans: [],
  setScanning: (isScanning) => set({ isScanning }),
  simulateScan: () => {
    // Mock data based on v1.0 schema
    set({
      scannedPatron: {
        id: 'mock-uuid-123',
        university_id: '2023-0001',
        full_name: 'Juan Dela Cruz',
        email: 'juan@ccc.edu.ph',
        role: 'STUDENT',
        program: 'BSPA',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      activeLoans: [
        {
          id: 'loan-1',
          patron_id: 'mock-uuid-123',
          resource_id: 'res-1',
          borrow_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days overdue
          return_date: null,
          status: 'OVERDUE',
          paid_fine_amount: 0,
          created_at: new Date().toISOString(),
          resources: {
            title: 'Introduction to Public Administration',
            author: 'Jane Doe',
            isbn: '978-0000000000',
            available_copies: 2
          },
          patrons: null
        }
      ]
    });
  },
  clearScan: () => set({ scannedPatron: null, activeLoans: [] })
}));
