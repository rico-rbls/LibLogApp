'use client'

import { useAppStore, type NotificationItem } from '@/lib/store'
import { motion, AnimatePresence, useMotionValue, useAnimation, PanInfo } from 'framer-motion'
import { ArrowLeft, Calendar, BookOpen, Megaphone, CheckCheck, Loader2, Filter } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'

const typeConfig: Record<string, { icon: typeof Calendar; color: string; bg: string }> = {
  due_date: { icon: Calendar, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  reservation: { icon: BookOpen, color: 'text-lib-purple dark:text-lib-purple-300', bg: 'bg-lib-purple-50 dark:bg-white/10' },
  announcement: { icon: Megaphone, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
}

type FilterTab = 'all' | 'unread' | 'mentions'

function getGroupLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return 'This Week'
  return 'Earlier'
}

function NotificationCard({
  notif,
  onDismiss,
}: {
  notif: NotificationItem
  onDismiss: (id: string) => void
}) {
  const x = useMotionValue(0)
  const controls = useAnimation()
  const config = typeConfig[notif.type] || typeConfig.announcement
  const Icon = config.icon

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      controls.start({ x: info.offset.x > 0 ? 300 : -300, opacity: 0, transition: { duration: 0.2 } }).then(() => {
        onDismiss(notif.id)
      })
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 200, height: 0, marginBottom: 0, padding: 0, overflow: 'hidden' }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="bg-card rounded-[22px] dark:shadow-sm p-4 flex items-start gap-3 touch-pan-y"
      >
        <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold leading-tight text-foreground">
              {notif.title}
            </h4>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
              {formatTime(notif.createdAt)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.message}</p>
          {!notif.isRead && (
            <span className="inline-block w-2 h-2 rounded-full bg-lib-purple mt-1.5" />
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHrs < 1) return 'Just now'
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export default function NotificationsScreen() {
  const { user, goBack, setUnreadCount } = useAppStore()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}`)
      const data = await res.json()
      if (res.ok && data.notifications) {
        const items: NotificationItem[] = data.notifications.map((n: Record<string, unknown>) => ({
          id: n.id as string,
          type: n.type as 'due_date' | 'reservation' | 'announcement',
          title: n.title as string,
          message: n.message as string,
          isRead: n.isRead as boolean,
          createdAt: n.createdAt as string,
        }))
        setNotifications(items)
        const unread = items.filter(n => !n.isRead).length
        setUnreadCount(unread)
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e)
    } finally {
      setLoading(false)
    }
  }, [user?.id, setUnreadCount])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAllRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.isRead)
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
    for (const n of unreadNotifs) {
      fetch(`/api/notifications/${n.id}/read`, { method: 'PUT' }).catch(() => {})
    }
  }

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set(prev).add(id))
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (dismissedIds.has(n.id)) return false
    if (activeFilter === 'unread') return !n.isRead
    if (activeFilter === 'mentions') return n.type === 'reservation'
    return true
  })

  // Group notifications by date
  const groupedNotifications: { label: string; items: NotificationItem[] }[] = []
  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Earlier']
  const groupMap = new Map<string, NotificationItem[]>()

  filteredNotifications.forEach(n => {
    const label = getGroupLabel(n.createdAt)
    if (!groupMap.has(label)) groupMap.set(label, [])
    groupMap.get(label)!.push(n)
  })

  groupOrder.forEach(label => {
    const items = groupMap.get(label)
    if (items && items.length > 0) {
      groupedNotifications.push({ label, items })
    }
  })

  const filterTabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'mentions', label: 'Mentions' },
  ]

  const hasUnread = notifications.some(n => !n.isRead)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card px-4 pt-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-lib-purple-50 dark:hover:bg-white/5">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h2 className="font-bold text-foreground text-lg">Notifications</h2>
          </div>
          {hasUnread && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs text-lib-purple dark:text-lib-purple-300 font-medium"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 pb-3">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                activeFilter === tab.id
                  ? 'bg-lib-purple text-white dark:shadow-sm dark:shadow-lib-purple/20'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-lib-purple-50 dark:hover:bg-white/5'
              }`}
            >
              {tab.id === 'all' && <Filter className="w-3 h-3" />}
              {tab.label}
              {tab.id === 'unread' && notifications.filter(n => !n.isRead).length > 0 && (
                <span className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                  activeFilter === tab.id ? 'bg-white/20 text-white' : 'bg-lib-purple text-white'
                }`}>
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications list */}
      <div className="flex-1 px-4 py-3 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-lib-purple animate-spin" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-lib-purple-50 dark:bg-white/10 flex items-center justify-center mb-3">
              <BookOpen className="w-8 h-8 text-lib-purple dark:text-lib-purple-300" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">
              {activeFilter === 'unread' ? 'No unread notifications' : 'No notifications'}
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              {activeFilter === 'unread' ? 'You\'re all caught up!' : 'You\'re all caught up!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedNotifications.map((group) => (
              <div key={group.label}>
                {/* Group header */}
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-[10px] font-semibold text-lib-purple dark:text-lib-purple-300 uppercase tracking-wider">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                  <span className="text-[10px] text-muted-foreground">{group.items.length}</span>
                </div>
                {/* Group items */}
                <div className="space-y-2">
                  <AnimatePresence>
                    {group.items.map((notif) => (
                      <NotificationCard
                        key={notif.id}
                        notif={notif}
                        onDismiss={handleDismiss}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="h-24" />
      </div>
    </div>
  )
}
