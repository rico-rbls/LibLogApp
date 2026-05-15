'use client'

import { useAppStore, type BorrowedBook } from '@/lib/store'
import { BookOpen, Clock, Loader2, CheckCircle2, ChevronRight, AlertTriangle, Info, Library } from 'lucide-react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getResourceCover } from '@/lib/covers'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

// ── Confetti Particle Component ──────────────────────────────────────
function ConfettiParticle({ delay, x, color, size }: { delay: number; x: number; color: string; size: number }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, x: 0, scale: 1, rotate: 0 }}
      animate={{ opacity: 0, y: -60 - Math.random() * 80, x: x, scale: 0.3, rotate: 360 + Math.random() * 360 }}
      transition={{ duration: 1.2 + Math.random() * 0.5, delay, ease: 'easeOut' }}
      className="absolute rounded-sm"
      style={{ width: size, height: size, backgroundColor: color, top: '50%', left: '50%' }}
    />
  )
}

// ── Success Celebration Overlay ──────────────────────────────────────
function SuccessOverlay({ bookTitle, onDismiss }: { bookTitle: string; onDismiss: () => void }) {
  const confettiColors = ['#652D90', '#9B5BBF', '#B87DD4', '#4ADE80', '#22C55E', '#F59E0B', '#EC4899']
  const particles = useMemo(() =>
    Array.from({ length: 18 }).map((_, i) => ({
      delay: i * 0.04,
      x: (Math.random() - 0.5) * 200,
      color: confettiColors[i % confettiColors.length],
      size: 4 + Math.random() * 6,
    })), [])

  useEffect(() => {
    const timer = setTimeout(onDismiss, 2000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
        className="relative flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p, i) => (
            <ConfettiParticle key={i} {...p} />
          ))}
        </div>

        {/* Green checkmark circle */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.5, times: [0, 0.6, 1], ease: 'easeOut' }}
          className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center dark:shadow-lg dark:shadow-green-500/30"
        >
          <motion.svg
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
            className="w-12 h-12 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <motion.path
              d="M5 13l4 4L19 7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
            />
          </motion.svg>
        </motion.div>

        {/* Success text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-center"
        >
          <p className="text-white font-bold text-lg">Book Returned!</p>
          <p className="text-white/70 text-sm mt-1 max-w-[200px]">{bookTitle}</p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

const FINE_RATE_PER_DAY = 5.00 // ₱5.00 per day

function formatCurrency(amount: number): string {
  return `₱${amount.toFixed(2)}`
}

export default function BorrowedScreen() {
  const { user, setSelectedBookId, setCurrentScreen } = useAppStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'active' | 'reading' | 'history'>('active')
  const [activeBooks, setActiveBooks] = useState<BorrowedBook[]>([])
  const [historyBooks, setHistoryBooks] = useState<BorrowedBook[]>([])
  const [readingSessions, setReadingSessions] = useState<{
    id: string
    title: string
    author: string
    startTime: string
    resourceId: string
  }[]>([])
  const [loading, setLoading] = useState(true)
  const [returningId, setReturningId] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [returnedBookTitle, setReturnedBookTitle] = useState('')

  // Derived fine calculations
  const overdueBooks = useMemo(() => activeBooks.filter(b => b.status === 'overdue'), [activeBooks])
  const totalFines = useMemo(() => overdueBooks.reduce((sum, b) => sum + Math.abs(b.daysLeft) * FINE_RATE_PER_DAY, 0), [overdueBooks])

  const fetchData = useCallback(async () => {
    if (!user?.id) return
    try {
      // Active borrows
      const activeRes = await fetch(`/api/borrow?userId=${user.id}&status=active`)
      const activeData = await activeRes.json()
      const activeRecords = Array.isArray(activeData) ? activeData : (activeData.records || [])
      if (activeRes.ok && activeRecords.length > 0) {
        const books: BorrowedBook[] = activeRecords.map((r: Record<string, unknown>) => {
          const dueDate = new Date(r.dueDate as string)
          const now = new Date()
          const diffMs = dueDate.getTime() - now.getTime()
          const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
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
          }
        })
        setActiveBooks(books)
      }

      // Active reading sessions
      const readingRes = await fetch(`/api/reading-sessions?userId=${user.id}&status=active`)
      if (readingRes.ok) {
        const readingData = await readingRes.json()
        const sessions = Array.isArray(readingData) ? readingData : []
        setReadingSessions(sessions.map((s: Record<string, unknown>) => ({
          id: s.id as string,
          title: (s.resource as Record<string, unknown>)?.title as string || 'Unknown',
          author: (s.resource as Record<string, unknown>)?.author as string || 'Unknown',
          startTime: s.startTime as string,
          resourceId: s.resourceId as string,
        })))
      }

      // History
      const historyRes = await fetch(`/api/borrow?userId=${user.id}&status=returned`)
      const historyData = await historyRes.json()
      const historyRecords = Array.isArray(historyData) ? historyData : (historyData.records || [])
      if (historyRes.ok && historyRecords.length > 0) {
        const books: BorrowedBook[] = historyRecords.map((r: Record<string, unknown>) => {
          const dueDate = new Date(r.dueDate as string)
          const returnDate = r.returnDate ? new Date(r.returnDate as string) : null
          return {
            id: r.id as string,
            title: (r.resource as Record<string, unknown>)?.title as string || 'Unknown',
            author: (r.resource as Record<string, unknown>)?.author as string || 'Unknown',
            category: (r.resource as Record<string, unknown>)?.subject as string || '',
            coverImage: (r.resource as Record<string, unknown>)?.coverImage as string | null,
            borrowDate: new Date(r.borrowDate as string).toLocaleDateString(),
            dueDate: dueDate.toLocaleDateString(),
            returnDate: returnDate?.toLocaleDateString() ?? '',
            status: 'active' as const,
            daysLeft: 0,
          }
        })
        setHistoryBooks(books)
      }
    } catch (e) {
      console.error('Failed to fetch borrowed data:', e)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleReturn = async (borrowId: string, bookTitle: string) => {
    setReturningId(borrowId)
    try {
      const res = await fetch(`/api/borrow/${borrowId}/return`, { method: 'PUT' })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Cannot Return', description: data.error || 'Something went wrong', variant: 'destructive' })
        return
      }
      // Show celebration overlay
      setReturnedBookTitle(bookTitle)
      setShowSuccess(true)
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to return book. Please try again.', variant: 'destructive' })
    } finally {
      setReturningId(null)
    }
  }

  const dismissSuccess = useCallback(() => {
    setShowSuccess(false)
  }, [])

  const books = activeTab === 'active' ? activeBooks : activeTab === 'reading' ? [] : historyBooks

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Success celebration overlay */}
      <AnimatePresence>
        {showSuccess && (
          <SuccessOverlay bookTitle={returnedBookTitle} onDismiss={dismissSuccess} />
        )}
      </AnimatePresence>
      {/* Header with gradient accent */}
      <div className="bg-card px-4 pt-4 pb-3 border-b border-gray-100 dark:border-white/5">
        <h2 className="font-bold text-foreground text-lg mb-3">My Loans</h2>
        <div className="flex bg-lib-purple-50 dark:bg-white/10 rounded-xl p-1">
          {(['active', 'reading', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-[#1a0e2e] dark:shadow-sm text-lib-purple dark:text-white'
                  : 'text-lib-purple-400 dark:text-gray-400 hover:text-lib-purple-600 dark:hover:text-gray-300'
              }`}
            >
              {tab === 'active' ? `Loans (${activeBooks.length})` : tab === 'reading' ? `Reading (${readingSessions.length})` : `History (${historyBooks.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats bar */}
      <div className="flex items-center gap-4 px-4 py-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-lib-purple" />
          <span className="text-xs text-muted-foreground">{activeBooks.length} Loans</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-xs text-muted-foreground">{readingSessions.length} Reading</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-muted-foreground">{historyBooks.length} Returned</span>
        </div>
        {overdueBooks.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs text-red-600 dark:text-red-400 font-medium">{overdueBooks.length} Overdue</span>
          </div>
        )}
      </div>

      {/* Books list */}
      <div className="flex-1 px-4 py-3 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-lib-purple animate-spin" />
          </div>
        ) : activeTab === 'reading' ? (
          readingSessions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <div className="w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4">
                <Library className="w-10 h-10 text-amber-500 dark:text-amber-400" />
              </div>
              <h3 className="font-bold text-foreground mb-1">Not reading</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Scan a book QR code to start reading in the library
              </p>
              <Button
                onClick={() => setCurrentScreen('qr-scan')}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs h-9 px-4 rounded-xl"
              >
                Scan a Book
              </Button>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key="reading"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-3"
              >
                {readingSessions.map((session, index) => {
                  const startTime = new Date(session.startTime)
                  const now = new Date()
                  const diffMs = now.getTime() - startTime.getTime()
                  const diffMins = Math.floor(diffMs / (1000 * 60))
                  const diffHours = Math.floor(diffMins / 60)
                  const remainingMins = diffMins % 60
                  const durationText = diffHours > 0
                    ? `${diffHours}h ${remainingMins}m`
                    : diffMins === 0 ? 'Just started' : `${diffMins}m`

                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.07 }}
                      className="bg-card rounded-[22px] dark:shadow-sm overflow-hidden relative border border-amber-200 dark:border-amber-800/30"
                    >
                      <div className="flex items-start gap-3 p-4">
                        <div className="w-14 h-[72px] rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                          <Library className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm text-foreground leading-tight line-clamp-2">{session.title}</h4>
                            <Badge className="text-[9px] h-5 flex-shrink-0 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-0">
                              In Library
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{session.author}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                              <Clock className="w-3 h-3" />
                              {durationText}
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-lib-purple dark:text-lib-purple-300 hover:text-lib-purple-dark hover:bg-lib-purple-50 dark:hover:bg-white/5 font-medium"
                              onClick={() => { setSelectedBookId(session.resourceId); setCurrentScreen('book-detail') }}
                            >
                              View Details <ChevronRight className="w-3 h-3 ml-0.5" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/reading-sessions/${session.id}/end`, { method: 'PUT' })
                                  if (res.ok) {
                                    setReadingSessions(prev => prev.filter(s => s.id !== session.id))
                                    toast({ title: 'Reading Ended', description: `Finished reading "${session.title}"` })
                                  }
                                } catch (e) {
                                  console.error('Failed to stop reading:', e)
                                }
                              }}
                              className="h-8 px-4 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold"
                            >
                              Stop Reading
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            </AnimatePresence>
          )
        ) : books.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="w-20 h-20 rounded-2xl bg-lib-purple-50 dark:bg-white/10 flex items-center justify-center mb-4">
              <BookOpen className="w-10 h-10 text-lib-purple dark:text-lib-purple-300" />
            </div>
            <h3 className="font-bold text-foreground mb-1">No books yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Your borrowing history will appear here
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-3"
            >
              {/* Fines Summary Card — only shows on Active tab when there are overdue items */}
              {activeTab === 'active' && overdueBooks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-red-800 dark:text-red-300 text-sm">Overdue Fines</h4>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-red-700 dark:text-red-400">{formatCurrency(totalFines)}</span>
                        <span className="text-xs text-red-600/70 dark:text-red-400/70">total owed</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                        <span>{overdueBooks.length} overdue {overdueBooks.length === 1 ? 'item' : 'items'} · Fine rate: {formatCurrency(FINE_RATE_PER_DAY)}/day</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                        <p className="text-[11px] text-red-500 dark:text-red-400/70 italic">
                          Pay at the circulation desk · Fines accrue at {formatCurrency(FINE_RATE_PER_DAY)}/day until returned
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {books.map((book, index) => {
                const isOverdue = book.status === 'overdue'
                const isDueSoon = !isOverdue && book.daysLeft >= 1 && book.daysLeft <= 3
                const overdueFine = isOverdue ? Math.abs(book.daysLeft) * FINE_RATE_PER_DAY : 0

                return (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.07 }}
                    className="bg-card rounded-[22px] dark:shadow-sm overflow-hidden relative"
                  >
                    <div className="flex items-start gap-3 p-4">
                      {(() => {
                        const coverSrc = getResourceCover(book.coverImage, book.title)
                        return coverSrc ? (
                          <img src={coverSrc} alt={book.title} className="w-14 h-[72px] rounded-lg object-cover flex-shrink-0 dark:shadow-sm" />
                        ) : (
                          <div className="w-14 h-[72px] rounded-lg bg-purple-gradient flex items-center justify-center flex-shrink-0 dark:shadow-sm cover-pattern-overlay">
                            <BookOpen className="w-5 h-5 text-white/50" />
                          </div>
                        )
                      })()}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-foreground leading-tight line-clamp-2">{book.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{book.author}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                          <span>Borrowed: {book.borrowDate}</span>
                          <span>Due: {book.dueDate}</span>
                        </div>
                        {activeTab === 'active' && (
                          <>
                            <div className="flex items-center justify-between mt-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                isOverdue
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                  : isDueSoon
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              }`}>
                                <Clock className="w-3 h-3" />
                                {isOverdue
                                  ? `${Math.abs(book.daysLeft)} days overdue`
                                  : `${book.daysLeft} days left`
                                }
                              </span>
                              <Button
                                size="sm"
                                onClick={() => handleReturn(book.id, book.title)}
                                disabled={returningId === book.id}
                                className="h-8 px-4 text-xs bg-lib-purple hover:bg-lib-purple-dark text-white rounded-xl dark:shadow-sm dark:shadow-lib-purple/20 font-semibold"
                              >
                                {returningId === book.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  'Return'
                                )}
                              </Button>
                            </div>
                            {/* Overdue Fine Badge */}
                            {isOverdue && (
                              <div className="mt-2 flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-600 dark:bg-red-700 text-white">
                                  <AlertTriangle className="w-3 h-3" />
                                  Overdue Fine: {formatCurrency(overdueFine)}
                                </span>
                                <span className="text-[10px] text-red-500 dark:text-red-400">
                                  Overdue {Math.abs(book.daysLeft)} days · Fine: {formatCurrency(overdueFine)}
                                </span>
                              </div>
                            )}
                            {/* Due Soon Warning */}
                            {isDueSoon && (
                              <div className="mt-2 flex items-start gap-1.5 text-[10px] text-amber-600 dark:text-amber-400">
                                <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                <span>Due soon — return within {book.daysLeft} {book.daysLeft === 1 ? 'day' : 'days'} to avoid fines</span>
                              </div>
                            )}
                            {/* Fine accrual notice for overdue */}
                            {isOverdue && (
                              <p className="mt-1 text-[10px] text-muted-foreground dark:text-gray-500 flex items-center gap-1">
                                <Info className="w-2.5 h-2.5" />
                                Fines accrue at {formatCurrency(FINE_RATE_PER_DAY)}/day until returned
                              </p>
                            )}
                          </>
                        )}
                        {activeTab === 'history' && (
                          <div className="flex items-center justify-between mt-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" />
                              Returned{book.returnDate ? ` on ${book.returnDate}` : ''}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setSelectedBookId(book.id); setCurrentScreen('book-detail') }}
                              className="h-7 px-2 text-xs text-lib-purple dark:text-lib-purple-300 hover:text-lib-purple-dark hover:bg-lib-purple-50 dark:hover:bg-white/5 font-medium"
                            >
                              View <ChevronRight className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </AnimatePresence>
        )}
        <div className="h-24" />
      </div>
    </div>
  )
}
