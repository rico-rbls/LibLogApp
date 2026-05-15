import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AppScreen = 'onboarding' | 'home' | 'search' | 'qr-scan' | 'borrowed' | 'profile' | 'settings' | 'notifications' | 'book-detail' | 'login' | 'attendance' | 'favorites' | 'reservations' | 'edit-profile'

export interface UserState {
  id: string
  fullName: string
  email: string
  universityId: string
  role: 'student' | 'faculty' | 'visitor'
  program: string
  department: string
  yearLevel: string
  avatarInitials: string
  streakCount: number
  isOnboarded: boolean
  notificationDueDate: boolean
  notificationReservation: boolean
  notificationAnnouncements: boolean
}

export interface BorrowedBook {
  id: string
  title: string
  author: string
  category: string
  coverImage: string | null
  borrowDate: string
  dueDate: string
  returnDate?: string
  status: 'active' | 'overdue'
  daysLeft: number
}

export interface ResourceItem {
  id: string
  title: string
  author: string
  category: 'book' | 'research' | 'magazine'
  coverImage: string | null
  availableCopies: number
  totalCopies: number
  shelfLocation: string
  status: string
  subject: string
  tags: string[]
}

export interface NotificationItem {
  id: string
  type: 'due_date' | 'reservation' | 'announcement'
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

interface AppState {
  // Navigation
  currentScreen: AppScreen
  previousScreen: AppScreen | null
  setCurrentScreen: (screen: AppScreen) => void
  goBack: () => void

  // Auth
  isAuthenticated: boolean
  user: UserState | null
  setUser: (user: UserState) => void
  logout: () => void

  // Onboarding
  onboardingStep: number
  setOnboardingStep: (step: number) => void
  onboardingData: {
    role: 'student' | 'faculty' | 'visitor' | ''
    fullName: string
    universityId: string
    program: string
    department: string
    yearLevel: string
    email: string
    password: string
    notificationDueDate: boolean
    notificationReservation: boolean
  }
  setOnboardingData: (data: Partial<AppState['onboardingData']>) => void
  resetOnboarding: () => void

  // Selected book for detail view
  selectedBookId: string | null
  setSelectedBookId: (id: string | null) => void

  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchCategory: 'all' | 'book' | 'research' | 'magazine'
  setSearchCategory: (category: 'all' | 'book' | 'research' | 'magazine') => void

  // Notifications
  unreadCount: number
  setUnreadCount: (count: number) => void

  // Favorites
  favorites: string[]
  toggleFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
}

const defaultOnboardingData = {
  role: '' as const,
  fullName: '',
  universityId: '',
  program: '',
  department: '',
  yearLevel: '',
  email: '',
  password: '',
  notificationDueDate: true,
  notificationReservation: true,
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Navigation
      currentScreen: 'onboarding',
      previousScreen: null,
      setCurrentScreen: (screen) => set((state) => ({ 
        currentScreen: screen, 
        previousScreen: state.currentScreen 
      })),
      goBack: () => set((state) => ({ 
        currentScreen: state.previousScreen || 'home',
        previousScreen: null 
      })),

      // Auth
      isAuthenticated: false,
      user: null,
      setUser: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ 
        user: null, 
        isAuthenticated: false, 
        currentScreen: 'login',
        previousScreen: null,
        onboardingStep: 0,
        onboardingData: defaultOnboardingData,
        selectedBookId: null,
        searchQuery: '',
        searchCategory: 'all',
        unreadCount: 0,
      }),

      // Onboarding
      onboardingStep: 0,
      setOnboardingStep: (step) => set({ onboardingStep: step }),
      onboardingData: defaultOnboardingData,
      setOnboardingData: (data) => set((state) => ({ 
        onboardingData: { ...state.onboardingData, ...data } 
      })),
      resetOnboarding: () => set({ 
        onboardingStep: 0, 
        onboardingData: defaultOnboardingData 
      }),

      // Selected book
      selectedBookId: null,
      setSelectedBookId: (id) => set({ selectedBookId: id }),

      // Search
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      searchCategory: 'all',
      setSearchCategory: (category) => set({ searchCategory: category }),

      // Notifications
      unreadCount: 3,
      setUnreadCount: (count) => set({ unreadCount: count }),

      // Favorites
      favorites: [],
      toggleFavorite: (id) => set((state) => {
        const exists = state.favorites.includes(id)
        return { favorites: exists ? state.favorites.filter(f => f !== id) : [...state.favorites, id] }
      }),
      isFavorite: (id) => get().favorites.includes(id),
    }),
    {
      name: 'liblog-store',
      partialize: (state) => ({
        // Do NOT persist currentScreen or isAuthenticated —
        // always start at login on app open
        user: state.user,
        onboardingStep: state.onboardingStep,
        onboardingData: state.onboardingData,
        favorites: state.favorites,
      }),
      onRehydrateStorage: () => (state) => {
        // Always reset to login on app open
        if (state) {
          state.isAuthenticated = false
          state.currentScreen = 'login'
        }
      },
    }
  )
)
