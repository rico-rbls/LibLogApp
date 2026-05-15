'use client'

import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Clock, Flame, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState, useMemo } from 'react'

interface AttendanceRecord {
  id: string
  date: string
  timeIn: string | null
  timeOut: string | null
  duration: number | null
}

const MOCK_RECORDS: AttendanceRecord[] = [
  { id: '1', date: '2026-03-01', timeIn: '08:15 AM', timeOut: '11:30 AM', duration: 195 },
  { id: '2', date: '2026-03-02', timeIn: '09:00 AM', timeOut: '12:45 PM', duration: 225 },
  { id: '3', date: '2026-03-03', timeIn: '07:45 AM', timeOut: '10:15 AM', duration: 150 },
  { id: '4', date: '2026-03-04', timeIn: '01:00 PM', timeOut: '05:30 PM', duration: 270 },
  { id: '5', date: '2026-03-05', timeIn: '08:30 AM', timeOut: '12:00 PM', duration: 210 },
  { id: '6', date: '2026-03-07', timeIn: '09:15 AM', timeOut: '01:45 PM', duration: 270 },
  { id: '7', date: '2026-03-08', timeIn: '10:00 AM', timeOut: '02:30 PM', duration: 270 },
  { id: '8', date: '2026-03-09', timeIn: '08:00 AM', timeOut: '11:00 AM', duration: 180 },
  { id: '9', date: '2026-03-10', timeIn: '02:00 PM', timeOut: '06:15 PM', duration: 255 },
  { id: '10', date: '2026-03-11', timeIn: '09:30 AM', timeOut: '12:30 PM', duration: 180 },
  { id: '11', date: '2026-03-12', timeIn: '07:30 AM', timeOut: '11:45 AM', duration: 255 },
]

function formatDuration(minutes: number | null): string {
  if (!minutes) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function AttendanceScreen() {
  const { user, goBack } = useAppStore()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const today = now.getDate()

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await fetch(`/api/attendance?userId=${user?.id}`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            const mapped: AttendanceRecord[] = data.map((r: Record<string, unknown>) => ({
              id: r.id as string,
              date: r.date as string,
              timeIn: r.timeIn ? new Date(r.timeIn as string).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : null,
              timeOut: r.timeOut ? new Date(r.timeOut as string).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : null,
              duration: r.duration as number | null,
            }))
            setRecords(mapped)
          } else {
            setRecords(MOCK_RECORDS)
          }
        } else {
          setRecords(MOCK_RECORDS)
        }
      } catch {
        setRecords(MOCK_RECORDS)
      } finally {
        setLoading(false)
      }
    }
    fetchAttendance()
  }, [user?.id])

  // Build a set of days with attendance for current month
  const attendedDays = useMemo(() => {
    const days = new Set<number>()
    records.forEach((r) => {
      const d = new Date(r.date + 'T00:00:00')
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        days.add(d.getDate())
      }
    })
    return days
  }, [records, currentYear, currentMonth])

  // Summary stats
  const totalVisits = attendedDays.size
  const totalMinutes = records.reduce((sum, r) => {
    const d = new Date(r.date + 'T00:00:00')
    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth && r.duration) {
      return sum + r.duration
    }
    return sum
  }, 0)
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10
  const streak = user?.streakCount ?? 0

  // Calendar grid data
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const firstDay = new Date(currentYear, currentMonth, 1).getDay() // 0=Sun
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  const calendarCells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) calendarCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d)
  // Fill remaining to complete last row
  while (calendarCells.length % 7 !== 0) calendarCells.push(null)

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Recent records (sorted by date desc)
  const recentRecords = useMemo(
    () =>
      [...records]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10),
    [records]
  )

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100 dark:border-white/5">
        <button onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-lib-purple-50 dark:hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h2 className="font-bold text-foreground text-lg">Library Attendance</h2>
      </div>

      <div className="flex-1 px-4 py-4 overflow-y-auto space-y-4">
        {/* Summary cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="bg-card rounded-[22px] dark:shadow-sm p-3 text-center">
            <div className="w-9 h-9 rounded-[14px] bg-lib-purple-50 dark:bg-white/10 flex items-center justify-center mx-auto mb-2">
              <MapPin className="w-4 h-4 text-lib-purple dark:text-lib-purple-300" />
            </div>
            <p className="text-xl font-bold text-foreground">{totalVisits}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Total Visits</p>
          </div>
          <div className="bg-card rounded-[22px] dark:shadow-sm p-3 text-center">
            <div className="w-9 h-9 rounded-[14px] bg-lib-purple-50 dark:bg-white/10 flex items-center justify-center mx-auto mb-2">
              <Clock className="w-4 h-4 text-lib-purple dark:text-lib-purple-300" />
            </div>
            <p className="text-xl font-bold text-foreground">{totalHours}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Total Hours</p>
          </div>
          <div className="bg-card rounded-[22px] dark:shadow-sm p-3 text-center">
            <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-xl font-bold text-foreground">{streak}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Day Streak</p>
          </div>
        </motion.div>

        {/* Calendar heat map */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-[22px] dark:shadow-sm p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-lib-purple dark:text-lib-purple-300" />
              {monthName}
            </h3>
            <Badge variant="secondary" className="text-[10px] bg-lib-purple-50 dark:bg-white/10 text-lib-purple dark:text-lib-purple-300">
              {totalVisits} visits
            </Badge>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayLabels.map((label) => (
              <div key={label} className="text-center text-[9px] font-medium text-muted-foreground py-1">
                {label}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="aspect-square" />
              }
              const isAttended = attendedDays.has(day)
              const isToday = day === today
              const isFuture = day > today

              return (
                <motion.div
                  key={`day-${day}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.01 * idx }}
                  className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-medium relative transition-all ${
                    isToday
                      ? 'ring-2 ring-lib-purple ring-offset-1'
                      : ''
                  } ${
                    isAttended
                      ? 'bg-lib-purple text-white'
                      : isFuture
                        ? 'bg-gray-50 dark:bg-white/5 text-muted-foreground/40'
                        : 'bg-gray-100 dark:bg-white/10 text-muted-foreground'
                  }`}
                >
                  {day}
                  {isToday && (
                    <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-lib-purple" />
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-lib-purple" />
              <span className="text-[10px] text-muted-foreground">Attended</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-white/10" />
              <span className="text-[10px] text-muted-foreground">No visit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm ring-2 ring-lib-purple ring-offset-1 bg-white dark:bg-gray-900" />
              <span className="text-[10px] text-muted-foreground">Today</span>
            </div>
          </div>
        </motion.div>

        {/* Recent visits */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h3 className="text-xs font-semibold text-lib-purple dark:text-lib-purple-300 uppercase tracking-wider mb-2 px-1">
            Recent Visits
          </h3>
          <div className="bg-card rounded-[22px] dark:shadow-sm overflow-hidden">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Loading attendance records...
              </div>
            ) : recentRecords.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No attendance records yet. Start by checking in at the library!
              </div>
            ) : (
              recentRecords.map((record, idx) => (
                <div
                  key={record.id}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    idx < recentRecords.length - 1 ? 'border-b border-gray-50 dark:border-white/5' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-[14px] bg-lib-purple-50 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-lib-purple dark:text-lib-purple-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{formatDate(record.date)}</p>
                    <p className="text-xs text-muted-foreground">
                      {record.timeIn ?? '—'} → {record.timeOut ?? '—'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <Badge variant="secondary" className="text-[10px] bg-lib-purple-50 dark:bg-white/10 text-lib-purple dark:text-lib-purple-300 font-semibold">
                      {formatDuration(record.duration)}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <div className="h-24" />
      </div>
    </div>
  )
}
