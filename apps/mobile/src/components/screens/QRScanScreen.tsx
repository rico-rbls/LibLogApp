'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  ScanLine, Zap, X, CheckCircle2, Clock, BookOpen,
  UserCheck, LogOut, ChevronRight, Loader2, BookMarked,
  ArrowRightLeft, Library,
} from 'lucide-react'
import { useAppStore, type ResourceItem } from '@/lib/store'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getResourceCover } from '@/lib/covers'

type ScanMode = 'attendance' | 'checkout' | 'exit'

interface ScanResult {
  success: boolean
  mode: ScanMode
  timestamp: string
}

interface ExitSummary {
  attendance: { timedOut: boolean; duration?: number; message?: string }
  endedReadingSessions: { id: string; title: string; author: string; durationMinutes: number }[]
  totalReadingSessionsEnded: number
  returnedBooks: { id: string; title: string; author: string }[]
  totalReturned: number
}

export default function QRScanScreen() {
  const { user, setCurrentScreen, setSelectedBookId } = useAppStore()
  const [mode, setMode] = useState<ScanMode>('attendance')
  const [torchOn, setTorchOn] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [scannedBook, setScannedBook] = useState<ResourceItem | null>(null)
  const [startingReading, setStartingReading] = useState(false)
  const [readingStarted, setReadingStarted] = useState(false)
  const [borrowing, setBorrowing] = useState(false)
  const [borrowed, setBorrowed] = useState(false)
  const [exitSummary, setExitSummary] = useState<ExitSummary | null>(null)
  const [processingExit, setProcessingExit] = useState(false)

  const handleClose = useCallback(() => {
    setCurrentScreen('home')
  }, [setCurrentScreen])

  // Auto-simulate scan after entering viewfinder
  useEffect(() => {
    if (scanning || result) return

    const timer = setTimeout(() => {
      setScanning(true)
      // Simulate scanning delay
      setTimeout(() => {
        setScanning(false)
        setResult({
          success: true,
          mode,
          timestamp: new Date().toLocaleString(),
        })

        // Mode-specific post-scan actions
        if (mode === 'checkout') {
          fetchRandomBook()
        } else if (mode === 'exit') {
          processLibraryExit()
        }
      }, 3000)
    }, 2000)

    return () => clearTimeout(timer)
  }, [scanning, result, mode])

  const fetchRandomBook = useCallback(async () => {
    try {
      const res = await fetch('/api/resources?limit=7')
      const data = await res.json()
      if (res.ok && data.resources?.length > 0) {
        const randomIdx = Math.floor(Math.random() * data.resources.length)
        const r = data.resources[randomIdx]
        setScannedBook({
          id: r.id,
          title: r.title,
          author: r.author,
          category: r.category,
          coverImage: r.coverImage,
          availableCopies: r.availableCopies,
          totalCopies: r.copies,
          shelfLocation: r.shelfLocation,
          status: r.status,
          subject: r.subject,
          tags: (r.tags || '').split(',').filter(Boolean),
        })
      }
    } catch (e) {
      console.error('Failed to fetch book:', e)
    }
  }, [])

  const processLibraryExit = useCallback(async () => {
    if (!user?.id) return
    setProcessingExit(true)
    try {
      const res = await fetch('/api/library/exit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setExitSummary(data)
      }
    } catch (e) {
      console.error('Failed to process exit:', e)
    } finally {
      setProcessingExit(false)
    }
  }, [user?.id])

  const handleStartReading = async () => {
    if (!user?.id || !scannedBook) return
    setStartingReading(true)
    try {
      const res = await fetch('/api/reading-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, resourceId: scannedBook.id }),
      })
      if (res.ok) {
        setReadingStarted(true)
      } else {
        const data = await res.json()
        if (data.error?.includes('already have an active')) {
          setReadingStarted(true) // Already reading
        }
      }
    } catch (e) {
      console.error('Failed to start reading:', e)
    } finally {
      setStartingReading(false)
    }
  }

  const handleBorrow = async () => {
    if (!user?.id || !scannedBook) return
    setBorrowing(true)
    try {
      const res = await fetch('/api/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, resourceId: scannedBook.id }),
      })
      if (res.ok) {
        setBorrowed(true)
      }
    } catch (e) {
      console.error('Failed to borrow book:', e)
    } finally {
      setBorrowing(false)
    }
  }

  const handleViewBook = () => {
    if (scannedBook) {
      setSelectedBookId(scannedBook.id)
      setCurrentScreen('book-detail')
    }
  }

  const handleRetry = () => {
    setResult(null)
    setScanning(false)
    setScannedBook(null)
    setReadingStarted(false)
    setBorrowed(false)
    setExitSummary(null)
    setProcessingExit(false)
  }

  const handleDone = () => {
    setCurrentScreen('home')
  }

  const modeConfig: Record<ScanMode, { icon: React.ReactNode; label: string; activeIcon: React.ReactNode }> = {
    attendance: {
      icon: <UserCheck className="w-4 h-4" />,
      label: 'Check-in',
      activeIcon: <UserCheck className="w-3.5 h-3.5 text-white" />,
    },
    checkout: {
      icon: <BookOpen className="w-4 h-4" />,
      label: 'Book Scan',
      activeIcon: <BookOpen className="w-3.5 h-3.5 text-white" />,
    },
    exit: {
      icon: <LogOut className="w-4 h-4" />,
      label: 'Exit',
      activeIcon: <LogOut className="w-3.5 h-3.5 text-white" />,
    },
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0d1a] items-center relative overflow-hidden">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 backdrop-blur-sm z-10 hover:bg-white/20 transition-colors"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {/* Mode indicator */}
      <div className="absolute top-4 left-4 z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-lib-purple/80 backdrop-blur-sm">
          {modeConfig[mode].activeIcon}
          <span className="text-xs font-medium text-white">
            {mode === 'attendance' ? 'Attendance' : mode === 'checkout' ? 'Book Scan' : 'Library Exit'}
          </span>
        </div>
      </div>

      {/* Title area */}
      <div className="text-center pt-16 pb-6 px-6">
        <h2 className="text-2xl font-bold text-white mb-2">Scan QR Code</h2>
        <p className="text-sm text-white/50 leading-relaxed">
          {mode === 'attendance'
            ? 'Point your camera at the entrance QR for attendance check-in'
            : mode === 'checkout'
            ? 'Scan the QR code on a book to read or borrow'
            : 'Scan the exit QR to check out of the library'}
        </p>
      </div>

      {/* Viewfinder */}
      <div className="relative w-64 h-64 my-4">
        {/* Outer glow */}
        <div className="absolute -inset-4 bg-lib-purple/10 rounded-3xl blur-xl" />

        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] border-lib-purple rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-lib-purple rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] border-lib-purple rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[3px] border-r-[3px] border-lib-purple rounded-br-xl" />

        {/* Inner corner accents */}
        <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-lib-purple/40 rounded-tl-sm" />
        <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-lib-purple/40 rounded-tr-sm" />
        <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-lib-purple/40 rounded-bl-sm" />
        <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-lib-purple/40 rounded-br-sm" />

        {/* Animated scan line */}
        <motion.div
          animate={{ y: [-110, 110, -110] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-6 right-6 h-[2px] z-10"
        >
          <div className="w-full h-full bg-gradient-to-r from-transparent via-lib-purple to-transparent" />
          <div className="w-full h-4 bg-gradient-to-r from-transparent via-lib-purple/20 to-transparent blur-sm -mt-2" />
        </motion.div>

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: scanning ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 0.8, repeat: scanning ? Infinity : 0 }}
            className="w-16 h-16 rounded-full bg-lib-purple/20 flex items-center justify-center backdrop-blur-sm"
          >
            <ScanLine className="w-8 h-8 text-lib-purple dark:text-lib-purple-300" />
          </motion.div>
        </div>

        {/* Semi-transparent background inside viewfinder */}
        <div className="absolute inset-0 bg-white/5 rounded-2xl" />
      </div>

      {/* Scanning status */}
      <AnimatePresence>
        {scanning && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center gap-2 mt-2"
          >
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-lib-purple"
            />
            <span className="text-sm text-lib-purple dark:text-lib-purple-300 font-medium">Scanning...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Mode buttons */}
      <div className="w-full px-6 pb-2">
        <div className="flex gap-2">
          {(Object.keys(modeConfig) as ScanMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); handleRetry() }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-medium text-xs transition-all duration-200 ${
                mode === m
                  ? 'bg-lib-purple text-white dark:shadow-lg dark:shadow-lib-purple/30'
                  : 'bg-white/10 text-white/60 hover:bg-white/15'
              }`}
            >
              {modeConfig[m].icon}
              {modeConfig[m].label}
            </button>
          ))}
        </div>
      </div>

      {/* Flash toggle */}
      <div className="w-full px-6 py-4">
        <button
          onClick={() => setTorchOn(!torchOn)}
          className={`mx-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
            torchOn
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              : 'bg-white/10 text-white/50 border border-white/10 hover:bg-white/15'
          }`}
        >
          <Zap className={`w-4 h-4 ${torchOn ? 'fill-yellow-400' : ''}`} />
          {torchOn ? 'Flash On' : 'Flash Off'}
        </button>
      </div>

      {/* ─── Result Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="bg-white dark:bg-[#1a0e2e] rounded-3xl w-full max-w-sm dark:shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* ── Attendance Mode Result ── */}
              {mode === 'attendance' && (
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
                    className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-5"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.4 }}
                    >
                      <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </motion.div>
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-xl font-bold text-foreground mb-2"
                  >
                    Attendance Logged!
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-sm text-muted-foreground mb-4"
                  >
                    Your library visit has been recorded successfully.
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-6"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {result.timestamp}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex gap-3"
                  >
                    <Button onClick={handleRetry} variant="outline" className="flex-1 rounded-xl py-5 border-gray-200 dark:border-gray-700">
                      Scan Again
                    </Button>
                    <Button onClick={handleDone} className="flex-1 rounded-xl py-5 bg-lib-purple hover:bg-lib-purple/90 text-white">
                      Done
                    </Button>
                  </motion.div>
                </div>
              )}

              {/* ── Book Checkout Mode Result ── */}
              {mode === 'checkout' && !scannedBook && (
                <div className="p-8 text-center">
                  <Loader2 className="w-8 h-8 text-lib-purple animate-spin mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Looking up book...</p>
                </div>
              )}

              {mode === 'checkout' && scannedBook && (
                <div>
                  {/* Book cover header */}
                  <div className="relative h-36 bg-purple-gradient overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      {(() => {
                        const coverSrc = getResourceCover(scannedBook.coverImage, scannedBook.title)
                        return coverSrc ? (
                          <img src={coverSrc} alt={scannedBook.title} className="w-20 h-28 rounded-xl object-cover dark:shadow-lg" />
                        ) : (
                          <div className="w-20 h-28 rounded-xl bg-white/20 flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-white/60" />
                          </div>
                        )
                      })()}
                    </div>
                    {/* Decorative circles */}
                    <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
                    <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/5" />
                  </div>

                  {/* Book details */}
                  <div className="p-5 pt-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-bold text-foreground leading-tight">{scannedBook.title}</h3>
                      <Badge className={`flex-shrink-0 text-[10px] h-5 ${
                        scannedBook.availableCopies > 0
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {scannedBook.availableCopies > 0 ? `${scannedBook.availableCopies} available` : 'Unavailable'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{scannedBook.author}</p>

                    {scannedBook.subject && (
                      <Badge variant="secondary" className="mb-3 text-[10px] h-5 bg-lib-purple-50 dark:bg-white/10 text-lib-purple dark:text-lib-purple-300">
                        {scannedBook.subject}
                      </Badge>
                    )}

                    {/* Reading started success message */}
                    {readingStarted ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 text-center mb-4"
                      >
                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-green-700 dark:text-green-400">You&apos;re now reading!</p>
                        <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">Read inside the library. Your session will end when you exit.</p>
                      </motion.div>
                    ) : borrowed ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 text-center mb-4"
                      >
                        <CheckCircle2 className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Book Borrowed!</p>
                        <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">You can take this book outside the library.</p>
                      </motion.div>
                    ) : scannedBook.availableCopies > 0 ? (
                      <div className="space-y-2.5 mb-3">
                        {/* Read in library option */}
                        <Button
                          onClick={handleStartReading}
                          disabled={startingReading}
                          className="w-full rounded-xl py-5 bg-lib-purple hover:bg-lib-purple/90 text-white font-semibold text-sm"
                        >
                          {startingReading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Starting...
                            </>
                          ) : (
                            <>
                              <Library className="w-4 h-4 mr-2" />
                              Read in Library
                            </>
                          )}
                        </Button>

                        {/* Borrow to take outside option */}
                        <Button
                          onClick={handleBorrow}
                          disabled={borrowing}
                          variant="outline"
                          className="w-full rounded-xl py-5 border-lib-purple-200 dark:border-lib-purple-700 text-lib-purple dark:text-lib-purple-300 font-semibold text-sm hover:bg-lib-purple-50 dark:hover:bg-white/5"
                        >
                          {borrowing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Borrowing...
                            </>
                          ) : (
                            <>
                              <ArrowRightLeft className="w-4 h-4 mr-2" />
                              Borrow to Take Home
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4 text-center mb-4">
                        <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">No copies available</p>
                        <p className="text-xs text-yellow-600/70 dark:text-yellow-400/70 mt-1">You can reserve this book instead.</p>
                      </div>
                    )}

                    <button
                      onClick={handleViewBook}
                      className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-lib-purple dark:text-lib-purple-300 text-sm font-medium hover:bg-lib-purple-50 dark:hover:bg-white/5 transition-colors"
                    >
                      View Full Details <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex gap-3 mt-3">
                      <Button onClick={handleRetry} variant="outline" className="flex-1 rounded-xl py-4 border-gray-200 dark:border-gray-700 text-xs">
                        Scan Another
                      </Button>
                      <Button onClick={handleDone} className="flex-1 rounded-xl py-4 bg-lib-purple hover:bg-lib-purple/90 text-white text-xs">
                        Done
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Library Exit Mode Result ── */}
              {mode === 'exit' && processingExit && (
                <div className="p-8 text-center">
                  <Loader2 className="w-8 h-8 text-lib-purple animate-spin mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Processing exit...</p>
                </div>
              )}

              {mode === 'exit' && !processingExit && exitSummary && (
                <div className="p-6">
                  {/* Success icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
                    className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4"
                  >
                    <LogOut className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </motion.div>

                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg font-bold text-foreground text-center mb-1"
                  >
                    Library Exit Complete
                  </motion.h3>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-muted-foreground text-center mb-5"
                  >
                    You&apos;ve been checked out of the library.
                  </motion.p>

                  {/* Attendance info */}
                  {exitSummary.attendance.timedOut && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-3 mb-3"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-green-700 dark:text-green-400">Attendance Checked Out</p>
                          <p className="text-[10px] text-green-600/70 dark:text-green-400/70">
                            {exitSummary.attendance.duration ? `${exitSummary.attendance.duration} min session` : 'Session recorded'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Ended reading sessions (in-library) */}
                  {exitSummary.totalReadingSessionsEnded > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55 }}
                      className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 mb-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Library className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                          {exitSummary.totalReadingSessionsEnded} reading session{exitSummary.totalReadingSessionsEnded > 1 ? 's' : ''} ended
                        </p>
                      </div>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                        {exitSummary.endedReadingSessions.map((book) => (
                          <div key={book.id} className="flex items-center gap-2 py-1 px-2 bg-white dark:bg-white/5 rounded-lg">
                            <BookOpen className="w-3 h-3 text-amber-600/60 dark:text-amber-400/60 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{book.title}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{book.author}</p>
                            </div>
                            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium flex-shrink-0">
                              {book.durationMinutes} min
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Returned borrowed books (outside) */}
                  {exitSummary.totalReturned > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-lib-purple-50 dark:bg-white/5 border border-lib-purple-200 dark:border-white/10 rounded-2xl p-3 mb-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <BookMarked className="w-4 h-4 text-lib-purple dark:text-lib-purple-300 flex-shrink-0" />
                        <p className="text-xs font-semibold text-lib-purple dark:text-lib-purple-300">
                          {exitSummary.totalReturned} book{exitSummary.totalReturned > 1 ? 's' : ''} returned
                        </p>
                      </div>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                        {exitSummary.returnedBooks.map((book) => (
                          <div key={book.id} className="flex items-center gap-2 py-1 px-2 bg-white dark:bg-white/5 rounded-lg">
                            <BookOpen className="w-3 h-3 text-lib-purple/60 dark:text-lib-purple-300/60 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{book.title}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{book.author}</p>
                            </div>
                            <span className="text-[9px] text-green-600 dark:text-green-400 font-medium flex-shrink-0">Returned</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {exitSummary.totalReadingSessionsEnded === 0 && exitSummary.totalReturned === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-3 mb-4"
                    >
                      <p className="text-xs text-muted-foreground text-center">No active books to return.</p>
                    </motion.div>
                  )}

                  {/* Timestamp */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-5"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {result.timestamp}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <Button onClick={handleDone} className="w-full rounded-xl py-5 bg-lib-purple hover:bg-lib-purple/90 text-white">
                      Done
                    </Button>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
