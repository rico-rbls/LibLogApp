'use client'

import { useAppStore } from '@/lib/store'
import { AnimatePresence, motion } from 'framer-motion'

import OnboardingScreen from '@/components/screens/OnboardingScreen'
import LoginScreen from '@/components/screens/LoginScreen'
import HomeScreen from '@/components/screens/HomeScreen'
import SearchScreen from '@/components/screens/SearchScreen'
import QRScanScreen from '@/components/screens/QRScanScreen'
import BorrowedScreen from '@/components/screens/BorrowedScreen'
import ProfileScreen from '@/components/screens/ProfileScreen'
import SettingsScreen from '@/components/screens/SettingsScreen'
import NotificationsScreen from '@/components/screens/NotificationsScreen'
import BookDetailScreen from '@/components/screens/BookDetailScreen'
import AttendanceScreen from '@/components/screens/AttendanceScreen'
import FavoritesScreen from '@/components/screens/FavoritesScreen'
import ReservationsScreen from '@/components/screens/ReservationsScreen'
import EditProfileScreen from '@/components/screens/EditProfileScreen'
import BottomNav from '@/components/layout/BottomNav'
import { useRef, useCallback } from 'react'

const screenComponents: Record<string, React.ComponentType> = {
  onboarding: OnboardingScreen,
  login: LoginScreen,
  home: HomeScreen,
  search: SearchScreen,
  'qr-scan': QRScanScreen,
  borrowed: BorrowedScreen,
  profile: ProfileScreen,
  settings: SettingsScreen,
  notifications: NotificationsScreen,
  'book-detail': BookDetailScreen,
  attendance: AttendanceScreen,
  favorites: FavoritesScreen,
  reservations: ReservationsScreen,
  'edit-profile': EditProfileScreen,
}

// Screens that should NOT show bottom nav
const noNavScreens = new Set(['onboarding', 'login', 'qr-scan'])

export default function Home() {
  const { currentScreen, isAuthenticated } = useAppStore()

  // If not authenticated, show onboarding or login
  // If on an auth screen, show that; otherwise default to home
  let displayScreen = currentScreen
  if (!isAuthenticated && !['onboarding', 'login'].includes(currentScreen)) {
    displayScreen = 'login'
  }

  const ScreenComponent = screenComponents[displayScreen] ?? HomeScreen
  const showNav = !noNavScreens.has(displayScreen) && isAuthenticated

  // Scroll direction detection — manipulate nav DOM directly to avoid setState in effects
  const scrollRef = useRef<HTMLDivElement>(null)
  const navWrapperRef = useRef<HTMLDivElement>(null)
  const lastScrollY = useRef(0)
  const navHidden = useRef(false)
  const ticking = useRef(false)

  const showNavEl = useCallback(() => {
    if (navHidden.current && navWrapperRef.current) {
      navWrapperRef.current.style.transform = 'translateY(0)'
      navWrapperRef.current.style.opacity = '1'
      navHidden.current = false
    }
  }, [])

  const hideNavEl = useCallback(() => {
    if (!navHidden.current && navWrapperRef.current) {
      navWrapperRef.current.style.transform = 'translateY(100%)'
      navWrapperRef.current.style.opacity = '0'
      navHidden.current = true
    }
  }, [])

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      ticking.current = true
      requestAnimationFrame(() => {
        const el = scrollRef.current
        if (!el) { ticking.current = false; return }
        const currentY = el.scrollTop
        const diff = currentY - lastScrollY.current
        if (diff > 8) {
          hideNavEl()
        } else if (diff < -5) {
          showNavEl()
        }
        if (currentY < 20) {
          showNavEl()
        }
        lastScrollY.current = currentY
        ticking.current = false
      })
    }
  }, [hideNavEl, showNavEl])

  const handleScreenChange = useCallback(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = 0
    lastScrollY.current = 0
    showNavEl()
  }, [showNavEl])

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-[430px] h-dvh bg-background relative dark:shadow-xl">
        {/* Screen content - full scrollable area */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={displayScreen}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              onAnimationStart={handleScreenChange}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              <ScreenComponent />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom navigation - transparent overlay, only card & scan are visible */}
        {showNav && (
          <div
            ref={navWrapperRef}
            className="absolute bottom-0 left-0 right-0 pointer-events-none transition-transform duration-300 ease-in-out"
            style={{ opacity: 1 }}
          >
            <div className="pointer-events-auto">
              <BottomNav />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
