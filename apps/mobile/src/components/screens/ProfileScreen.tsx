'use client'

import { useAppStore, type AppScreen } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Flame, Clock,
  X,
  ChevronRight, Edit, LogOut, MapPin, Heart, Mail, GraduationCap, FileText, Calendar, Bookmark, Target
} from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'

// Monthly reading data for bar chart
const monthlyData = [
  { month: 'Sep', books: 2 },
  { month: 'Oct', books: 4 },
  { month: 'Nov', books: 3 },
  { month: 'Dec', books: 1 },
  { month: 'Jan', books: 5 },
  { month: 'Feb', books: 3 },
  { month: 'Mar', books: 4 },
]

export default function ProfileScreen() {
  const { user, setCurrentScreen, logout, favorites } = useAppStore()
  const [borrowCount, setBorrowCount] = useState(0)
  const [attendanceCount, setAttendanceCount] = useState(0)
  const [readingGoal, setReadingGoal] = useState(24)
  const [showGoalPicker, setShowGoalPicker] = useState(false)
  const [showFullQR, setShowFullQR] = useState(false)
  const userIdRef = useRef(user?.id)

  useEffect(() => {
    const uid = user?.id
    if (!uid) return
    userIdRef.current = uid

    let cancelled = false
    const fetchStats = async () => {
      try {
        const [activeRes, historyRes, attendanceRes] = await Promise.all([
          fetch(`/api/borrow?userId=${uid}&status=active`),
          fetch(`/api/borrow?userId=${uid}&status=returned`),
          fetch(`/api/attendance?userId=${uid}`),
        ])
        if (cancelled) return
        const activeData = await activeRes.json()
        const historyData = await historyRes.json()
        const attendanceData = await attendanceRes.json()
        const activeRecords = Array.isArray(activeData) ? activeData : (activeData.records || [])
        const historyRecords = Array.isArray(historyData) ? historyData : (historyData.records || [])
        const attendanceRecords = Array.isArray(attendanceData) ? attendanceData : (attendanceData.records || [])
        setBorrowCount(activeRecords.length + historyRecords.length)
        setAttendanceCount(attendanceRecords.length)
      } catch {
        // silently fail
      }
    }
    fetchStats()
    return () => { cancelled = true }
  }, [user?.id])

  const stats = [
    { icon: BookOpen, label: 'Borrowed', value: String(borrowCount), color: 'text-lib-purple dark:text-lib-purple-300', bg: 'bg-lib-purple-50 dark:bg-white/10' },
    { icon: MapPin, label: 'Visits', value: String(attendanceCount), color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { icon: Flame, label: 'Streak', value: String(user?.streakCount ?? 0), color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  ]

  const roleLabel = user?.role === 'faculty' ? 'Faculty' : user?.role === 'visitor' ? 'Visitor' : 'Student'
  const maxBooks = Math.max(...monthlyData.map(d => d.books), 1)

  // Profile menu items — all use purple theme (same as home screen cards)
  const menuItems = [
    { id: 'edit-profile' as AppScreen, icon: Edit, label: 'Edit Profile', desc: 'Update your information', color: 'text-lib-purple dark:text-lib-purple-300', bg: 'bg-lib-purple-50 dark:bg-white/10' },
    { id: 'favorites' as AppScreen, icon: Heart, label: 'My Favorites', desc: `${favorites.length} saved book${favorites.length !== 1 ? 's' : ''}`, color: 'text-lib-purple dark:text-lib-purple-300', bg: 'bg-lib-purple-50 dark:bg-white/10' },
    { id: 'reservations' as AppScreen, icon: Bookmark, label: 'My Reservations', desc: 'Track reserved items', color: 'text-lib-purple dark:text-lib-purple-300', bg: 'bg-lib-purple-50 dark:bg-white/10' },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Profile header with gradient */}
      <div className="relative bg-purple-gradient px-6 pt-10 pb-14 rounded-b-[22px] overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute top-12 right-20 w-16 h-16 rounded-full bg-white/5" />

        <div className="flex flex-col items-center relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 ring-4 ring-white/20"
          >
            <span className="text-2xl font-bold text-white">{user?.avatarInitials ?? 'U'}</span>
          </motion.div>
          <h2 className="text-xl font-bold text-white">{user?.fullName ?? 'User'}</h2>
          {user?.email && (
            <div className="flex items-center gap-1.5 mt-1">
              <Mail className="w-3 h-3 text-white/50" />
              <p className="text-white/60 text-xs">{user.email}</p>
            </div>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white/90 text-[10px] font-medium">
              {roleLabel}
            </span>
            {user?.program && (
              <div className="flex items-center gap-1">
                <GraduationCap className="w-3 h-3 text-white/50" />
                <span className="text-white/60 text-[10px]">
                  {user.program}{user.yearLevel ? ` · ${user.yearLevel}` : ''}
                </span>
              </div>
            )}
          </div>
          <p className="text-white/40 text-[10px] mt-1 font-mono">ID: {user?.universityId}</p>
        </div>
      </div>

      {/* Stats cards - overlapping header — same bg-card as home screen */}
      <div className="px-4 -mt-8 relative z-20">
        <div className="bg-card rounded-[22px] dark:shadow-sm p-4 grid grid-cols-3 gap-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center gap-1.5"
              >
                <div className={`w-10 h-10 rounded-[14px] ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span className="text-lg font-bold text-foreground dark:text-white">{stat.value}</span>
                <span className="text-[10px] text-muted-foreground dark:text-white/50 text-center font-medium">{stat.label}</span>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* My QR Code card */}
      <div className="px-4 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-card rounded-[22px] dark:shadow-sm p-5"
        >
          <div className="flex flex-col items-center">
            <span className="text-sm font-semibold text-foreground dark:text-white mb-3">My Library QR Code</span>
            <button
              onClick={() => setShowFullQR(true)}
              className="bg-white p-3 rounded-2xl dark:shadow-sm active:scale-95 transition-transform"
              aria-label="View QR code full screen"
            >
              <QRCodeSVG
                value={JSON.stringify({
                  userId: user?.id,
                  name: user?.fullName,
                  universityId: user?.universityId,
                  role: user?.role,
                  type: 'library-access',
                })}
                size={140}
                level="M"
                bgColor="#ffffff"
                fgColor="#652D90"
                includeMargin={false}
              />
            </button>
            <p className="text-[10px] text-muted-foreground dark:text-white/40 mt-3 text-center leading-relaxed">
              Tap to expand · Present at library entrance<br />for attendance check-in
            </p>
            <div className="flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full bg-lib-purple-50 dark:bg-white/10">
              <Clock className="w-3 h-3 text-lib-purple dark:text-lib-purple-300" />
              <span className="text-[9px] font-medium text-lib-purple dark:text-lib-purple-300">Valid for attendance</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Full-screen QR overlay */}
      <AnimatePresence>
        {showFullQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6"
            onClick={() => setShowFullQR(false)}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-3xl p-8 dark:shadow-2xl flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between w-full mb-6">
                <div>
                  <h3 className="text-lg font-bold text-lib-purple">My Library QR Code</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Present at the library entrance</p>
                </div>
                <button
                  onClick={() => setShowFullQR(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="p-4 rounded-2xl bg-lib-purple-50">
                <QRCodeSVG
                  value={JSON.stringify({
                    userId: user?.id,
                    name: user?.fullName,
                    universityId: user?.universityId,
                    role: user?.role,
                    type: 'library-access',
                  })}
                  size={260}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#652D90"
                  includeMargin={false}
                />
              </div>
              <div className="mt-5 text-center">
                <p className="text-sm font-semibold text-gray-800">{user?.fullName}</p>
                <p className="text-xs text-gray-500 mt-0.5">ID: {user?.universityId}</p>
              </div>
              <div className="flex items-center gap-1.5 mt-3 px-4 py-2 rounded-full bg-lib-purple-50">
                <Clock className="w-3.5 h-3.5 text-lib-purple" />
                <span className="text-[10px] font-medium text-lib-purple">Valid for attendance check-in</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu items: Edit Profile, My Favorites, My Reservations — same bg-card color as home */}
      <div className="px-4 mt-3">
        <div className="bg-card rounded-[22px] dark:shadow-sm overflow-hidden divide-y divide-gray-50 dark:divide-white/5">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setCurrentScreen(item.id as AppScreen)}
                className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-lib-purple-50/30 dark:hover:bg-white/5 active:bg-lib-purple-50/50 transition-colors"
              >
                <div className={`w-9 h-9 rounded-[14px] ${item.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-sm font-medium text-foreground dark:text-white block">{item.label}</span>
                  {item.desc && <span className="text-[10px] text-muted-foreground dark:text-white/40">{item.desc}</span>}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground dark:text-white/20" />
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Reading Goal card — same bg-card */}
      <div className="px-4 mt-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-[22px] dark:shadow-sm p-4"
        >
          <div className="flex items-center gap-4">
            {/* Circular progress */}
            <div className="relative w-16 h-16 flex-shrink-0">
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
                <span className="text-xs font-bold text-lib-purple dark:text-lib-purple-300">{borrowCount}/{readingGoal}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground dark:text-white">Reading Goal</h4>
                <button
                  onClick={() => setShowGoalPicker(!showGoalPicker)}
                  className="text-xs text-lib-purple dark:text-lib-purple-300 font-medium"
                >
                  {showGoalPicker ? 'Done' : 'Change'}
                </button>
              </div>
              <p className="text-xs text-muted-foreground dark:text-white/40 mt-0.5">
                {borrowCount >= readingGoal
                  ? 'Goal achieved! Great job!'
                  : `${readingGoal - borrowCount} more book${readingGoal - borrowCount !== 1 ? 's' : ''} to reach your goal`
                }
              </p>
              {showGoalPicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex gap-2 mt-2"
                >
                  {[12, 24, 36, 48].map(goal => (
                    <button
                      key={goal}
                      onClick={() => { setReadingGoal(goal); setShowGoalPicker(false) }}
                      className={`flex-1 py-1.5 rounded-[14px] text-xs font-medium transition-all ${
                        readingGoal === goal
                          ? 'bg-lib-purple text-white'
                          : 'bg-lib-purple-50 dark:bg-white/10 text-lib-purple dark:text-lib-purple-300 hover:bg-lib-purple-100 dark:hover:bg-white/15'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Reading Stats card with mini bar chart — same bg-card */}
      <div className="px-4 mt-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="bg-card rounded-[22px] dark:shadow-sm p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-foreground dark:text-white">Reading Stats</span>
            <span className="text-[10px] text-muted-foreground dark:text-white/40">Books per month</span>
          </div>
          {/* Mini bar chart */}
          <div className="flex items-end gap-2 h-20">
            {monthlyData.map((d, i) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.books / maxBooks) * 100}%` }}
                  transition={{ delay: 0.2 + i * 0.05, duration: 0.4, ease: 'easeOut' }}
                  className={`w-full rounded-t-md min-h-[4px] ${
                    i === monthlyData.length - 1 ? 'bg-lib-purple' : 'bg-lib-purple-200 dark:bg-white/20'
                  }`}
                />
                <span className={`text-[9px] ${i === monthlyData.length - 1 ? 'text-lib-purple dark:text-lib-purple-300 font-bold' : 'text-muted-foreground dark:text-white/30'}`}>
                  {d.month}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 dark:border-white/5">
            <span className="text-[10px] text-muted-foreground dark:text-white/30">
              Total: {monthlyData.reduce((sum, d) => sum + d.books, 0)} books this year
            </span>
            <span className="text-[10px] font-medium text-lib-purple dark:text-lib-purple-300">
              Avg: {(monthlyData.reduce((sum, d) => sum + d.books, 0) / monthlyData.length).toFixed(1)}/mo
            </span>
          </div>
        </motion.div>
      </div>

      {/* Member Since card — same bg-card */}
      <div className="px-4 mt-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-[22px] dark:shadow-sm p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-[14px] bg-lib-purple-50 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-lib-purple dark:text-lib-purple-300" />
          </div>
          <div className="flex-1 text-left">
            <span className="text-sm font-semibold text-foreground dark:text-white">Member Since</span>
            <p className="text-[10px] text-muted-foreground dark:text-white/40 mt-0.5">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Attendance History — same bg-card */}
      <div className="px-4 mt-3">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          onClick={() => setCurrentScreen('attendance')}
          className="w-full bg-card rounded-[22px] dark:shadow-sm p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-[14px] bg-lib-purple-50 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-lib-purple dark:text-lib-purple-300" />
          </div>
          <div className="flex-1 text-left">
            <span className="text-sm font-semibold text-foreground dark:text-white">Attendance History</span>
            <p className="text-[10px] text-muted-foreground dark:text-white/40 mt-0.5">
              {attendanceCount} visit{attendanceCount !== 1 ? 's' : ''} recorded
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground dark:text-white/20" />
        </motion.button>
      </div>

      {/* Logout */}
      <div className="px-4 mt-4">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[22px] border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold text-sm hover:bg-red-100 dark:hover:bg-red-900/30 active:bg-red-200 dark:active:bg-red-900/40 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </motion.button>
      </div>

      <div className="h-24" />
    </div>
  )
}
