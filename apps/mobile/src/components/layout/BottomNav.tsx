'use client'

import { useAppStore, type AppScreen } from '@/lib/store'
import { Home, Search, ScanLine, BookOpen, User } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'

const navItems: { id: AppScreen; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'search', icon: Search, label: 'Catalog' },
  { id: 'borrowed', icon: BookOpen, label: 'Borrowed' },
  { id: 'profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const { currentScreen, setCurrentScreen, user } = useAppStore()
  const [activeBorrows, setActiveBorrows] = useState(0)

  useEffect(() => {
    if (!user?.id) return
    const fetchCount = async () => {
      try {
        const res = await fetch(`/api/borrow?userId=${user.id}&status=active`)
        if (res.ok) {
          const data = await res.json()
          const records = Array.isArray(data) ? data : (data.records || [])
          setActiveBorrows(records.length)
        }
      } catch {
        // silently fail
      }
    }
    fetchCount()
  }, [user?.id, currentScreen])

  const handleNavClick = useCallback((screenId: AppScreen) => {
    setCurrentScreen(screenId)
  }, [setCurrentScreen])

  const isScanActive = currentScreen === 'qr-scan'

  return (
    <nav>
      <div className="flex items-center gap-2.5 px-4 pt-2 pb-4">
        {/* Card containing 4 nav icons */}
        <div className="flex-1 flex items-center justify-around py-2 px-1.5 rounded-2xl bg-card shadow-sm">
          {navItems.map((item) => {
            const isActive = currentScreen === item.id
            const Icon = item.icon

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="flex flex-col items-center"
                aria-label={item.label}
              >
                <div
                  className={`relative flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-colors duration-200 ${
                    isActive ? 'bg-lib-purple' : ''
                  }`}
                >
                  <div className="relative flex items-center justify-center">
                    <Icon
                      className={`w-5 h-5 transition-colors duration-200 ${
                        isActive ? 'text-white' : 'text-muted-foreground'
                      }`}
                    />
                    {/* Badge for active borrows */}
                    {item.id === 'borrowed' && activeBorrows > 0 && (
                      <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 rounded-full bg-red-500 text-[7px] text-white font-bold flex items-center justify-center px-0.5">
                        {activeBorrows}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[8px] transition-colors duration-200 leading-tight ${
                      isActive ? 'text-white font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Scan — same height as the 4-icon card */}
        <button
          onClick={() => handleNavClick('qr-scan')}
          className="self-stretch"
          aria-label="Scan"
        >
          <div
            className={`h-full min-h-[52px] w-[52px] rounded-2xl flex items-center justify-center shadow-sm transition-all duration-200 ${
              isScanActive
                ? 'bg-lib-purple-light shadow-lib-purple/50'
                : 'bg-lib-purple shadow-lib-purple/40'
            }`}
          >
            <ScanLine className="w-6 h-6 text-white" />
          </div>
        </button>
      </div>
    </nav>
  )
}
