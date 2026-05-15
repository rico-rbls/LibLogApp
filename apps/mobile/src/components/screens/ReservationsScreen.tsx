'use client'

import { useAppStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Bookmark, BookOpen, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getResourceCover } from '@/lib/covers'

interface ReservationItem {
  id: string
  resourceId: string
  resourceTitle: string
  resourceAuthor: string
  resourceCategory: string
  status: 'pending' | 'fulfilled' | 'cancelled'
  createdAt: string
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string; badgeClass: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', badgeClass: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400', label: 'Pending' },
  fulfilled: { icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', badgeClass: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', label: 'Fulfilled' },
  cancelled: { icon: XCircle, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', badgeClass: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400', label: 'Cancelled' },
}

export default function ReservationsScreen() {
  const { user, goBack, setCurrentScreen, setSelectedBookId } = useAppStore()
  const [reservations, setReservations] = useState<ReservationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'fulfilled'>('all')

  const fetchReservations = useCallback(async () => {
    if (!user?.id) return
    try {
      const res = await fetch(`/api/reservations?userId=${user.id}`)
      const data = await res.json()
      const reservationRecords = Array.isArray(data) ? data : (data.reservations || [])
      if (res.ok && reservationRecords.length > 0) {
        const items: ReservationItem[] = reservationRecords.map((r: Record<string, unknown>) => ({
          id: r.id as string,
          resourceId: (r.resource as Record<string, unknown>)?.id as string || r.resourceId as string,
          resourceTitle: (r.resource as Record<string, unknown>)?.title as string || 'Unknown',
          resourceAuthor: (r.resource as Record<string, unknown>)?.author as string || 'Unknown',
          resourceCategory: (r.resource as Record<string, unknown>)?.category as string || 'book',
          status: r.status as 'pending' | 'fulfilled' | 'cancelled',
          createdAt: r.createdAt as string,
        }))
        setReservations(items)
      }
    } catch (e) {
      console.error('Failed to fetch reservations:', e)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  const handleCancel = async (id: string) => {
    try {
      const res = await fetch(`/api/reservations/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' as const } : r))
      }
    } catch {
      // silently fail
    }
  }

  const filtered = reservations.filter(r => {
    if (activeFilter === 'pending') return r.status === 'pending'
    if (activeFilter === 'fulfilled') return r.status === 'fulfilled'
    return true
  })

  const pendingCount = reservations.filter(r => r.status === 'pending').length

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card px-4 pt-4 pb-3 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-lib-purple-50 dark:hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-foreground text-lg">My Reservations</h2>
            <p className="text-xs text-muted-foreground">{pendingCount} active reservation{pendingCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="w-9 h-9 rounded-[14px] bg-lib-purple-50 dark:bg-white/10 flex items-center justify-center">
            <Bookmark className="w-4 h-4 text-lib-purple dark:text-lib-purple-300" />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['all', 'pending', 'fulfilled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                activeFilter === tab
                  ? 'bg-lib-purple text-white dark:shadow-sm dark:shadow-lib-purple/20'
                  : 'bg-lib-purple-50 dark:bg-white/10 text-lib-purple dark:text-lib-purple-300 hover:bg-lib-purple-100 dark:hover:bg-white/5'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'pending' && pendingCount > 0 && (
                <span className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                  activeFilter === tab ? 'bg-white/20 text-white' : 'bg-lib-purple text-white'
                }`}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Reservations list */}
      <div className="flex-1 px-4 py-3 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-lib-purple animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="w-20 h-20 rounded-[22px] bg-lib-purple-50 dark:bg-white/10 flex items-center justify-center mb-4">
              <Bookmark className="w-10 h-10 text-lib-purple dark:text-lib-purple-300" />
            </div>
            <h3 className="font-bold text-foreground mb-1">
              {activeFilter === 'pending' ? 'No pending reservations' : 'No reservations'}
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-4 max-w-[240px]">
              {activeFilter === 'pending'
                ? 'All your reservations have been processed'
                : 'Reserve unavailable books and we\'ll notify you when they\'re ready'}
            </p>
            <Button
              onClick={() => setCurrentScreen('search')}
              className="bg-lib-purple hover:bg-lib-purple-dark text-white text-xs h-9 px-4 rounded-xl"
            >
              Browse Catalog
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filtered.map((reservation, index) => {
              const config = statusConfig[reservation.status] || statusConfig.pending
              const StatusIcon = config.icon
              return (
                <motion.div
                  key={reservation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-[22px] dark:shadow-sm overflow-hidden"
                >
                  <div className="p-4 flex items-start gap-3">
                    <button
                      onClick={() => { setSelectedBookId(reservation.resourceId); setCurrentScreen('book-detail') }}
                      className="flex-shrink-0"
                    >
                      {(() => {
                        const coverSrc = getResourceCover(null, reservation.resourceTitle)
                        return coverSrc ? (
                          <img src={coverSrc} alt={reservation.resourceTitle} className="w-14 h-[72px] rounded-lg object-cover dark:shadow-sm" />
                        ) : (
                          <div className="w-14 h-[72px] rounded-lg bg-purple-gradient flex items-center justify-center cover-pattern-overlay dark:shadow-sm">
                            <BookOpen className="w-5 h-5 text-white/50" />
                          </div>
                        )
                      })()}
                    </button>
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => { setSelectedBookId(reservation.resourceId); setCurrentScreen('book-detail') }}
                        className="text-left w-full"
                      >
                        <h4 className="font-semibold text-sm text-foreground leading-tight line-clamp-2">{reservation.resourceTitle}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{reservation.resourceAuthor}</p>
                      </button>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className={`text-[10px] h-5 ${config.badgeClass} border-0 font-semibold`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(reservation.createdAt)}
                        </span>
                      </div>
                      {reservation.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(reservation.id)}
                          className="mt-2 h-7 px-2 text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium"
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      )}
                      {reservation.status === 'fulfilled' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedBookId(reservation.resourceId); setCurrentScreen('book-detail') }}
                          className="mt-2 h-7 px-2 text-xs text-lib-purple dark:text-lib-purple-300 hover:text-lib-purple-dark hover:bg-lib-purple-50 dark:hover:bg-white/5 font-medium"
                        >
                          Borrow Now
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
        <div className="h-24" />
      </div>
    </div>
  )
}
