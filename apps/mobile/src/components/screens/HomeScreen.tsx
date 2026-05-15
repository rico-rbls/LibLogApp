'use client'

import { useAppStore, type BorrowedBook, type ResourceItem } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Settings, BookOpen,
  ChevronRight, Loader2, X,
  Star, Flame, Library, Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState, useCallback, useRef } from 'react'
import { getResourceCover } from '@/lib/covers'

// ── Types ──────────────────────────────────────────────────────────
interface Announcement {
  id: string
  title: string
  message: string
  targetRoles: string
  isActive: boolean
  createdAt: string
}

interface TrendingItem {
  id: string
  rank: number
  title: string
  author: string
  borrows: number
  category: string
}

// ── Section header - clean, no decorations ──────────────────────────
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold text-foreground tracking-tight">{children}</h3>
  )
}

// ── Shimmer / skeleton card ────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-card rounded-3xl dark:shadow-sm p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-1.5 w-full" />
    </div>
  )
}

function SkeletonRecommendations() {
  return (
    <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[120px] space-y-2">
          <Skeleton className="w-[120px] h-[160px] rounded-2xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2 w-14" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Stagger animation variants ─────────────────────────────────────
const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' },
  }),
}

// ── Main component ─────────────────────────────────────────────────
export default function HomeScreen() {
  const { user, setCurrentScreen, setSelectedBookId, unreadCount } = useAppStore()

  // Data state
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([])
  const [recommendations, setRecommendations] = useState<ResourceItem[]>([])
  const [trending, setTrending] = useState<TrendingItem[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set())
  const [libraryOpen, setLibraryOpen] = useState(true)
  const [closingTime, setClosingTime] = useState('9PM')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [highlightBook, setHighlightBook] = useState<ResourceItem | null>(null)
  const [expandedAnnouncement, setExpandedAnnouncement] = useState<string | null>(null)

  // Reading sessions (in-library)
  const [activeReadings, setActiveReadings] = useState<{
    id: string
    title: string
    author: string
    startTime: string
    resourceId: string
  }[]>([])

  // Reading goal & attendance stats
  const [readingGoal, setReadingGoal] = useState(24)
  const [showGoalPicker, setShowGoalPicker] = useState(false)
  const [borrowCount, setBorrowCount] = useState(0)
  const [attendanceCount, setAttendanceCount] = useState(0)
  const [totalHours, setTotalHours] = useState(0)

  // Announcement carousel
  const [announcementIndex, setAnnouncementIndex] = useState(0)
  const carouselRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Pull-to-refresh
  const [pullDistance, setPullDistance] = useState(0)
  const touchStartY = useRef(0)

  // ── Fetch all data ────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!user?.id) return
    try {
      const borrowRes = await fetch(`/api/borrow?userId=${user.id}&status=active`)
      const borrowData = await borrowRes.json()
      const borrowRecords = Array.isArray(borrowData) ? borrowData : (borrowData.records || [])
      if (borrowRes.ok && borrowRecords.length > 0) {
        const books: BorrowedBook[] = borrowRecords.map((r: Record<string, unknown>) => {
          const dueDate = new Date(r.dueDate as string)
          const now = new Date()
          const diffMs = dueDate.getTime() - now.getTime()
          const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
          const borrowDate = new Date(r.borrowDate as string)
          const totalDays = Math.ceil((dueDate.getTime() - borrowDate.getTime()) / (1000 * 60 * 60 * 24))
          return {
            id: r.id as string,
            title: (r.resource as Record<string, unknown>)?.title as string || 'Unknown',
            author: (r.resource as Record<string, unknown>)?.author as string || 'Unknown',
            category: (r.resource as Record<string, unknown>)?.subject as string || '',
            coverImage: (r.resource as Record<string, unknown>)?.coverImage as string | null,
            borrowDate: new Date(r.borrowDate as string).toLocaleDateString(),
            dueDate: dueDate.toLocaleDateString(),
            status: daysLeft < 0 ? 'overdue' : 'active',
            daysLeft,
            _totalDays: totalDays,
            _elapsed: totalDays - Math.max(0, daysLeft),
          }
        })
        setBorrowedBooks(books)
      }

      // Fetch borrow count and attendance for home cards
      const [returnedRes, attendanceRes] = await Promise.all([
        fetch(`/api/borrow?userId=${user.id}&status=returned`),
        fetch(`/api/attendance?userId=${user.id}`),
      ])
      if (returnedRes.ok) {
        const returnedData = await returnedRes.json()
        const returnedRecords = Array.isArray(returnedData) ? returnedData : (returnedData.records || [])
        setBorrowCount(borrowRecords.length + returnedRecords.length)
      }
      if (attendanceRes.ok) {
        const attData = await attendanceRes.json()
        const attRecords = Array.isArray(attData) ? attData : (attData.records || [])
        setAttendanceCount(attRecords.length)
        const hrs = attRecords.reduce((sum: number, r: Record<string, unknown>) => sum + ((r.duration as number) || 0), 0)
        setTotalHours(Math.round(hrs / 60))
      }

      const program = user?.program || ''
      let programResources: ResourceItem[] = []
      if (program) {
        const progRes = await fetch(`/api/resources?subject=${encodeURIComponent(program)}&limit=6`)
        const progData = await progRes.json()
        if (progRes.ok && progData.resources) {
          programResources = progData.resources.map(mapResource)
        }
      }

      const genRes = await fetch('/api/resources?limit=6')
      const genData = await genRes.json()
      let generalResources: ResourceItem[] = []
      if (genRes.ok && genData.resources) {
        generalResources = genData.resources.map(mapResource)
      }

      const seen = new Set(programResources.map(r => r.id))
      const merged = [...programResources, ...generalResources.filter(r => !seen.has(r.id))].slice(0, 6)
      setRecommendations(merged.length > 0 ? merged : generalResources)

      const trendingRes = await fetch('/api/resources?limit=5')
      const trendingData = await trendingRes.json()
      if (trendingRes.ok && trendingData.resources) {
        const mockBorrowCounts = [142, 128, 97, 85, 76]
        const trendingItems: TrendingItem[] = trendingData.resources.map((r: Record<string, unknown>, i: number) => ({
          id: r.id as string,
          rank: i + 1,
          title: r.title as string,
          author: r.author as string,
          borrows: mockBorrowCounts[i] || Math.floor(Math.random() * 100) + 30,
          category: r.category as string,
        }))
        setTrending(trendingItems)
      }

      const highlightRes = await fetch('/api/resources?limit=7')
      const highlightData = await highlightRes.json()
      if (highlightRes.ok && highlightData.resources && highlightData.resources.length > 0) {
        const randomIdx = Math.floor(Math.random() * Math.min(highlightData.resources.length, 5))
        setHighlightBook(mapResource(highlightData.resources[randomIdx]))
      }

      const annRes = await fetch('/api/announcements')
      const annData = await annRes.json()
      if (annRes.ok && Array.isArray(annData)) {
        setAnnouncements(annData)
      }

      // Fetch active reading sessions
      const readingRes = await fetch(`/api/reading-sessions?userId=${user.id}&status=active`)
      if (readingRes.ok) {
        const readingData = await readingRes.json()
        const sessions = Array.isArray(readingData) ? readingData : []
        setActiveReadings(sessions.map((s: Record<string, unknown>) => ({
          id: s.id as string,
          title: (s.resource as Record<string, unknown>)?.title as string || 'Unknown',
          author: (s.resource as Record<string, unknown>)?.author as string || 'Unknown',
          startTime: s.startTime as string,
          resourceId: s.resourceId as string,
        })))
      }

      const settingsRes = await fetch('/api/settings')
      const settingsData = await settingsRes.json()
      if (settingsRes.ok) {
        setLibraryOpen(settingsData.isOpen)
        const ct = settingsData.closingTime || '21:00'
        const hour = parseInt(ct.split(':')[0])
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour > 12 ? hour - 12 : hour
        setClosingTime(`${displayHour}${ampm}`)
      }
    } catch (e) {
      console.error('Failed to fetch home data:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.id, user?.program])

  function mapResource(r: Record<string, unknown>): ResourceItem {
    return {
      id: r.id as string,
      title: r.title as string,
      author: r.author as string,
      category: r.category as 'book' | 'research' | 'magazine',
      coverImage: r.coverImage as string | null,
      availableCopies: r.availableCopies as number,
      totalCopies: r.copies as number,
      shelfLocation: r.shelfLocation as string,
      status: r.status as string,
      subject: r.subject as string,
      tags: (r.tags as string || '').split(',').filter(Boolean),
    }
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const visibleAnnouncements = announcements.filter(a => !dismissedAnnouncements.has(a.id))

  useEffect(() => {
    if (visibleAnnouncements.length <= 1) {
      if (carouselRef.current) clearInterval(carouselRef.current)
      return
    }
    carouselRef.current = setInterval(() => {
      setAnnouncementIndex(prev => (prev + 1) % visibleAnnouncements.length)
    }, 5000)
    return () => {
      if (carouselRef.current) clearInterval(carouselRef.current)
    }
  }, [visibleAnnouncements.length])

  useEffect(() => {
    if (announcementIndex >= visibleAnnouncements.length) {
      setAnnouncementIndex(0)
    }
  }, [announcementIndex, visibleAnnouncements.length])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = e.touches[0].clientY - touchStartY.current
    if (diff > 0 && diff < 100) {
      setPullDistance(diff)
    }
  }

  const handleTouchEnd = () => {
    if (pullDistance > 60 && !refreshing) {
      setRefreshing(true)
      fetchData()
    }
    setPullDistance(0)
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const formatShortDate = () => {
    const d = new Date()
    const day = d.getDate()
    const month = d.toLocaleDateString('en-US', { month: 'long' })
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' })
    return `${weekday.toUpperCase()}, ${month.toUpperCase()} ${day}`
  }

  const activeBook = borrowedBooks[0]
  const totalDays = (activeBook as BorrowedBook & { _totalDays?: number })?._totalDays || 14
  const elapsed = (activeBook as BorrowedBook & { _elapsed?: number })?._elapsed || 0
  const progressPercent = activeBook ? Math.min(100, Math.max(0, (elapsed / totalDays) * 100)) : 0

  const currentAnnouncement = visibleAnnouncements[announcementIndex] || null

  // ── Loading state ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-2">
              <Skeleton className="w-9 h-9 rounded-2xl" />
              <Skeleton className="w-9 h-9 rounded-2xl" />
            </div>
          </div>
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="px-5 py-3 space-y-4">
          <SkeletonCard />
          <SkeletonRecommendations />
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col bg-background"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <AnimatePresence>
        {pullDistance > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: Math.min(pullDistance * 0.5, 40), opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center justify-center overflow-hidden"
          >
            <Loader2 className={`w-5 h-5 text-lib-purple ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-xs text-lib-purple dark:text-lib-purple-300 ml-1.5">
              {refreshing ? 'Refreshing...' : 'Pull to refresh'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top section with greeting ─────────────────────── */}
      <div className="px-5 pt-6 pb-5">
        {/* Top bar: streak card + action buttons */}
        <div className="flex items-center justify-between mb-5">
          {/* Streak card - orange theme */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-orange-400 dark:bg-orange-500">
            <Flame className="w-4 h-4 text-white" />
            <span className="text-sm font-bold text-white">x{user?.streakCount ?? 0} day streak!</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Bell icon inside squircle card */}
            <button
              onClick={() => setCurrentScreen('notifications')}
              className="relative p-2.5 rounded-xl bg-card dark:shadow-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4.5 h-4.5 text-lib-purple dark:text-lib-purple-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
            {/* Settings icon inside squircle card */}
            <button
              onClick={() => setCurrentScreen('settings')}
              className="p-2.5 rounded-xl bg-card dark:shadow-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-4.5 h-4.5 text-lib-purple dark:text-lib-purple-300" />
            </button>
          </div>
        </div>

        {/* Date above greeting */}
        <p className="text-[11px] font-bold text-muted-foreground tracking-wide uppercase mb-1">
          {formatShortDate()}
        </p>

        {/* Greeting - large header */}
        <AnimatePresence mode="wait">
          <motion.h1
            key={greeting()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="text-2xl text-foreground tracking-tight"
          >
            {greeting()}, <span className="font-bold">{user?.fullName?.split(' ')[0] ?? 'User'}!</span>
          </motion.h1>
        </AnimatePresence>

        {/* Library status */}
        <div className="mt-4">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${
            libraryOpen
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <motion.span
              className={`w-2 h-2 rounded-full ${libraryOpen ? 'bg-green-500' : 'bg-red-500'}`}
              animate={libraryOpen ? {
                scale: 1.4,
                opacity: 0.7,
              } : {}}
              transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
            />
            <span className={`text-xs font-medium ${libraryOpen ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              Library {libraryOpen ? 'Open' : 'Closed'} · {libraryOpen ? `Closes ${closingTime}` : 'Opens tomorrow'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main content sections ─────────────────────────────── */}
      <div className="px-5 pb-6 space-y-4">

        {/* ── Announcements section ────────────────────────── */}
        {visibleAnnouncements.length > 0 && currentAnnouncement && (
          <motion.div
            custom={0}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-card rounded-3xl dark:shadow-sm p-4"
          >
            <div className="mb-3">
              <SectionHeader>Announcements</SectionHeader>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentAnnouncement.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-lib-purple-50 dark:bg-white/5 border border-lib-purple-200 dark:border-white/10 rounded-2xl p-3 relative"
              >
                <button
                  onClick={() => {
                    setDismissedAnnouncements(prev => new Set(prev).add(currentAnnouncement.id))
                    setAnnouncementIndex(0)
                  }}
                  className="absolute top-2.5 right-2.5 p-1 rounded-full hover:bg-lib-purple-100 dark:hover:bg-white/10 transition-colors"
                  aria-label="Dismiss announcement"
                >
                  <X className="w-3 h-3 text-lib-purple dark:text-lib-purple-300" />
                </button>
                <div className="min-w-0 pr-6">
                  <h4 className="font-semibold text-lib-purple dark:text-lib-purple-300 text-sm leading-tight">{currentAnnouncement.title}</h4>
                  {expandedAnnouncement === currentAnnouncement.id && (
                    <p className="text-xs text-lib-purple-700 dark:text-lib-purple-400/70 mt-1 leading-relaxed">{currentAnnouncement.message}</p>
                  )}
                </div>
                <button
                  onClick={() => setExpandedAnnouncement(prev => prev === currentAnnouncement.id ? null : currentAnnouncement.id)}
                  className="mt-2 text-xs font-semibold text-lib-purple dark:text-lib-purple-300 hover:text-lib-purple-light transition-colors"
                >
                  {expandedAnnouncement === currentAnnouncement.id ? 'Read less' : 'Read full'}
                </button>
                {/* Carousel dots */}
                {visibleAnnouncements.length > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-3">
                    {visibleAnnouncements.map((a, idx) => (
                      <button
                        key={a.id}
                        onClick={() => { setAnnouncementIndex(idx); setExpandedAnnouncement(null) }}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          idx === announcementIndex ? 'bg-lib-purple w-4' : 'bg-lib-purple-300 dark:bg-lib-purple-700'
                        }`}
                        aria-label={`Go to announcement ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── 2-column square cards: Attendance Analytics + Reading Goal ── */}
        <motion.div
          custom={0.5}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-3"
        >
          {/* Left: Attendance Analytics */}
          <div className="bg-card rounded-3xl dark:shadow-sm p-4 aspect-square flex flex-col">
            <span className="text-xs font-bold text-foreground leading-tight mb-3">Attendance</span>
            <div className="flex-1 flex flex-col justify-center items-center gap-2">
              <div className="text-center">
                <span className="text-3xl font-bold text-foreground">{Math.max(attendanceCount, 5)}</span>
                <span className="text-xs text-muted-foreground font-medium ml-1">visits</span>
              </div>
              <div className="w-full flex items-center justify-center gap-3">
                <div className="text-center">
                  <span className="text-sm font-bold text-foreground">{totalHours}</span>
                  <span className="text-[9px] text-muted-foreground ml-0.5">hours</span>
                </div>
                <div className="w-px h-6 bg-gray-200 dark:bg-white/10" />
                <div className="text-center">
                  <span className="text-sm font-bold text-orange-500">x{user?.streakCount ?? 0}</span>
                  <span className="text-[9px] text-muted-foreground ml-0.5">streak</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Reading Goal */}
          <div className="bg-card rounded-3xl dark:shadow-sm p-4 aspect-square flex flex-col">
            <span className="text-xs font-bold text-foreground leading-tight mb-3">Reading Goal</span>
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-lib-purple-200 dark:text-white/10"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${Math.min(100, (borrowCount / readingGoal) * 100)}, 100`}
                    strokeLinecap="round"
                    className="text-lib-purple dark:text-lib-purple-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-lib-purple dark:text-lib-purple-300">{borrowCount}/{readingGoal}</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                {borrowCount >= readingGoal ? 'Goal achieved!' : `${readingGoal - borrowCount} more to go`}
              </p>
              <button
                onClick={() => setShowGoalPicker(!showGoalPicker)}
                className="text-[9px] text-lib-purple dark:text-lib-purple-300 font-semibold"
              >
                {showGoalPicker ? 'Done' : 'Change'}
              </button>
              {showGoalPicker && (
                <div className="flex gap-1 mt-0.5">
                  {[12, 24, 36, 48].map(goal => (
                    <button
                      key={goal}
                      onClick={() => { setReadingGoal(goal); setShowGoalPicker(false) }}
                      className={`px-1.5 py-0.5 rounded-lg text-[9px] font-medium transition-all ${
                        readingGoal === goal
                          ? 'bg-lib-purple text-white'
                          : 'bg-lib-purple-50 dark:bg-white/10 text-lib-purple dark:text-lib-purple-300'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Today's Highlights feature card ─────────────── */}
        {highlightBook && (
          <motion.div
            custom={0.5}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-card rounded-3xl dark:shadow-sm p-4"
          >
            <div className="mb-3">
              <SectionHeader>Today&apos;s Highlight</SectionHeader>
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => { setSelectedBookId(highlightBook.id); setCurrentScreen('book-detail') }}
              className="w-full bg-lib-purple-50 dark:bg-white/5 border border-lib-purple-200 dark:border-white/10 rounded-2xl p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-16 h-20 rounded-2xl bg-lib-purple-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-7 h-7 text-lib-purple/50 dark:text-lib-purple-300/50" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-[10px] font-medium text-lib-purple dark:text-lib-purple-300">Featured Pick</span>
                  </div>
                  <h4 className="text-sm font-bold text-lib-purple dark:text-lib-purple-200 leading-tight line-clamp-2">{highlightBook.title}</h4>
                  <p className="text-xs text-lib-purple/60 dark:text-lib-purple-400/70 mt-0.5">{highlightBook.author}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {highlightBook.availableCopies > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-lib-purple-100 dark:bg-white/10 text-lib-purple dark:text-lib-purple-300 text-[10px] font-medium">
                        {highlightBook.availableCopies} available
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] font-medium">
                        Currently unavailable
                      </span>
                    )}
                    <ChevronRight className="w-3 h-3 text-lib-purple/40 dark:text-lib-purple-300/40" />
                  </div>
                </div>
              </div>
            </motion.button>
          </motion.div>
        )}

        {/* ── Currently Reading (in-library) ────────────────── */}
        {activeReadings.length > 0 && (
          <motion.div
            custom={0.8}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-card rounded-3xl dark:shadow-sm p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <SectionHeader>Currently Reading</SectionHeader>
              <Badge className="text-[9px] h-4 px-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-0">
                In Library
              </Badge>
            </div>
            <div className="space-y-2.5">
              {activeReadings.map((reading, idx) => {
                const startTime = new Date(reading.startTime)
                const now = new Date()
                const diffMs = now.getTime() - startTime.getTime()
                const diffMins = Math.floor(diffMs / (1000 * 60))
                const diffHours = Math.floor(diffMins / 60)
                const remainingMins = diffMins % 60
                const durationText = diffHours > 0
                  ? `${diffHours}h ${remainingMins}m`
                  : `${diffMins}m`

                return (
                  <motion.div
                    key={reading.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                        <Library className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground text-sm leading-tight truncate">{reading.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{reading.author}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400">
                            Reading for {durationText}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-xs font-medium p-0 flex-shrink-0"
                        onClick={() => { setSelectedBookId(reading.resourceId); setCurrentScreen('book-detail') }}
                      >
                        View <ChevronRight className="w-3 h-3 ml-0.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-[10px] border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg flex-shrink-0"
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/reading-sessions/${reading.id}/end`, { method: 'PUT' })
                            if (res.ok) {
                              setActiveReadings(prev => prev.filter(r => r.id !== reading.id))
                            }
                          } catch (e) {
                            console.error('Failed to stop reading:', e)
                          }
                        }}
                      >
                        Stop Reading
                      </Button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ── Active borrowed book card ───────────────────── */}
        <motion.div
          custom={1}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="bg-card rounded-3xl dark:shadow-sm p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <SectionHeader>Current Borrow</SectionHeader>
            {borrowedBooks.length > 0 && (
              <Badge className="text-[9px] h-4 px-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-0">
                Take Home
              </Badge>
            )}
          </div>
          {activeBook ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 rounded-2xl overflow-hidden"
            >
              <div className="p-1">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm leading-tight">{activeBook.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{activeBook.author}</p>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ml-2 ${
                    activeBook.status === 'overdue'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      : activeBook.daysLeft <= 3
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      : 'bg-lib-purple-50 dark:bg-white/10 text-lib-purple dark:text-lib-purple-300'
                  }`}>
                    {activeBook.status === 'overdue'
                      ? `${Math.abs(activeBook.daysLeft)} days overdue`
                      : `${activeBook.daysLeft} days left`
                    }
                  </div>
                </div>

                {activeBook.category && (
                  <Badge variant="secondary" className="mb-2 text-[10px] h-5 bg-lib-purple-50 dark:bg-white/10 text-lib-purple dark:text-lib-purple-300 border-lib-purple-200 dark:border-white/10">
                    {activeBook.category}
                  </Badge>
                )}

                <Progress value={progressPercent} className="h-1.5 mt-2" />
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-muted-foreground">Borrowed {activeBook.borrowDate}</span>
                  <span className="text-[10px] text-muted-foreground">Due {activeBook.dueDate}</span>
                </div>

                <div className="flex justify-end mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-lib-purple dark:text-lib-purple-300 hover:text-lib-purple-light hover:bg-lib-purple-50 dark:hover:bg-white/10 text-xs font-medium p-0"
                    onClick={() => { setSelectedBookId(activeBook.id); setCurrentScreen('book-detail') }}
                  >
                    View Details <ChevronRight className="w-3 h-3 ml-0.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 rounded-2xl bg-lib-purple-50 dark:bg-white/5 border border-lib-purple-200 dark:border-white/10 p-4 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground text-sm">No Active Borrows</h4>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Your reading list is empty. Explore the catalog!
                </p>
              </div>
              <Button
                size="sm"
                className="bg-lib-purple hover:bg-lib-purple-light text-white text-xs h-9 px-4 rounded-2xl dark:shadow-sm dark:shadow-lib-purple/20 flex-shrink-0"
                onClick={() => setCurrentScreen('search')}
              >
                <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                Browse
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* ── Recommended for You ──────────────────────────── */}
        {recommendations.length > 0 && (
          <motion.div
            custom={2}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-card rounded-3xl dark:shadow-sm p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <SectionHeader>Recommended for You</SectionHeader>
              <button
                onClick={() => setCurrentScreen('search')}
                className="text-xs text-lib-purple dark:text-lib-purple-300 font-medium flex items-center gap-0.5"
              >
                See All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-2 px-2">
              {recommendations.map((book) => {
                const isForYou = user?.program && book.subject?.toLowerCase().includes(user.program.toLowerCase())
                return (
                  <motion.button
                    key={book.id}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => { setSelectedBookId(book.id); setCurrentScreen('book-detail') }}
                    className="flex-shrink-0 w-[120px] group"
                  >
                    {/* Cover image - fixed height for alignment */}
                    <div className="w-[120px] h-[160px] rounded-2xl mb-2 relative overflow-hidden dark:shadow-sm group-hover:dark:shadow-md transition-shadow">
                      {(() => {
                        const coverSrc = getResourceCover(book.coverImage, book.title)
                        return coverSrc ? (
                          <>
                            <img src={coverSrc} alt={book.title} className="w-full h-full object-cover" />
                            {book.category && (
                              <span className="absolute top-1.5 left-1.5 bg-white/90 dark:bg-black/60 text-lib-purple dark:text-lib-purple-300 text-[8px] font-bold px-1.5 py-0.5 rounded-lg leading-none">
                                {book.category}
                              </span>
                            )}
                            {isForYou && (
                              <span className="absolute top-1.5 right-1.5 bg-amber-400 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-lg leading-none flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                For You
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="w-full h-full bg-purple-gradient flex items-center justify-center cover-pattern-overlay">
                              <BookOpen className="w-7 h-7 text-white/50" />
                            </div>
                            {book.category && (
                              <span className="absolute top-1.5 left-1.5 bg-white/90 dark:bg-black/60 text-lib-purple dark:text-lib-purple-300 text-[8px] font-bold px-1.5 py-0.5 rounded-lg leading-none">
                                {book.category}
                              </span>
                            )}
                            {isForYou && (
                              <span className="absolute top-1.5 right-1.5 bg-amber-400 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-lg leading-none flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                For You
                              </span>
                            )}
                          </>
                        )
                      })()}
                    </div>
                    {/* Text content - fixed min-height for alignment */}
                    <div className="flex flex-col">
                      <h4 className="text-xs font-semibold text-foreground leading-tight line-clamp-2 min-h-[28px]">{book.title}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{book.author}</p>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ── Trending in Your Department ──────────────────── */}
        {trending.length > 0 && (
          <motion.div
            custom={3}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-card rounded-3xl dark:shadow-sm p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <SectionHeader>Trending in Your Department</SectionHeader>
              <button
                onClick={() => setCurrentScreen('search')}
                className="text-xs text-lib-purple dark:text-lib-purple-300 font-medium flex items-center gap-0.5"
              >
                See All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-0">
              {trending.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => { setSelectedBookId(item.id); setCurrentScreen('book-detail') }}
                  className={`flex items-center gap-3 w-full py-3 hover:bg-lib-purple-50/50 dark:hover:bg-white/5 active:bg-lib-purple-50 dark:active:bg-white/10 transition-colors rounded-2xl px-1 ${
                    index < trending.length - 1 ? 'border-b border-gray-50 dark:border-white/5' : ''
                  }`}
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    item.rank <= 3 ? 'bg-lib-purple text-white' : 'bg-lib-purple-50 dark:bg-white/10 text-lib-purple dark:text-lib-purple-300'
                  }`}>
                    {item.rank}
                  </span>
                  <div className="flex-1 text-left min-w-0">
                    <h4 className="text-sm font-medium text-foreground truncate">{item.title}</h4>
                    <p className="text-[10px] text-muted-foreground">{item.author}</p>
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground flex-shrink-0">{item.borrows} borrows</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Bottom padding for nav bar ──────── */}
        <div className="h-24" />
      </div>
    </div>
  )
}
