'use client'

import { useAppStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Lock,
  Mail,
  Bell,
  Palette,
  Info,
  LogOut,
  Moon,
  Sun,
  User,
  Shield,
  FileText,
  Eye,
  EyeOff,
  Loader2,
  X,
  Check,
  HelpCircle,
  ChevronRight,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useTheme } from 'next-themes'

export default function SettingsScreen() {
  const { user, setCurrentScreen, goBack, logout } = useAppStore()
  const [dueDateNotif, setDueDateNotif] = useState(user?.notificationDueDate ?? true)
  const [reservationNotif, setReservationNotif] = useState(user?.notificationReservation ?? true)
  const [announcementNotif, setAnnouncementNotif] = useState(user?.notificationAnnouncements ?? false)
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const handleToggle = async (
    field: 'notificationDueDate' | 'notificationReservation' | 'notificationAnnouncements',
    value: boolean
  ) => {
    if (field === 'notificationDueDate') setDueDateNotif(value)
    if (field === 'notificationReservation') setReservationNotif(value)
    if (field === 'notificationAnnouncements') setAnnouncementNotif(value)

    try {
      await fetch('/api/auth/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, [field]: value }),
      })
      toast({ title: 'Preference updated' })
    } catch {
      toast({ title: 'Failed to update preference', variant: 'destructive' })
    }
  }

  const handleLogout = () => {
    logout()
    setCurrentScreen('login')
    toast({ title: 'Logged out successfully' })
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    if (!currentPassword) {
      setPasswordError('Please enter your current password')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password')
      return
    }

    setChangingPassword(true)
    try {
      const res = await fetch('/api/auth/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPasswordError(data.error || 'Failed to change password')
        return
      }
      toast({ title: 'Password changed successfully' })
      setShowPasswordModal(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch {
      setPasswordError('Something went wrong. Please try again.')
    } finally {
      setChangingPassword(false)
    }
  }

  const getPasswordStrength = () => {
    const p = newPassword
    if (p.length === 0) return { level: 0, label: '', color: '' }
    if (p.length < 6) return { level: 1, label: 'Weak', color: 'bg-red-400' }
    if (p.length < 8) return { level: 2, label: 'Fair', color: 'bg-yellow-400' }
    const hasUpper = /[A-Z]/.test(p)
    const hasNum = /[0-9]/.test(p)
    const hasSpecial = /[^A-Za-z0-9]/.test(p)
    const score = [hasUpper, hasNum, hasSpecial].filter(Boolean).length
    if (score >= 2) return { level: 4, label: 'Strong', color: 'bg-green-500' }
    return { level: 3, label: 'Good', color: 'bg-emerald-400' }
  }

  const strength = getPasswordStrength()

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card px-4 pt-4 pb-3 flex items-center gap-3 border-b border-border">
        <button onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-lib-purple-50 dark:hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h2 className="font-bold text-foreground text-lg">Settings</h2>
      </div>

      <div className="flex-1 px-4 py-4 overflow-y-auto space-y-4">
        {/* Account section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h3 className="text-xs font-semibold text-lib-purple dark:text-lib-purple-300 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            Account
          </h3>
          <div className="bg-card rounded-[22px] dark:shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
              <div className="w-10 h-10 rounded-[14px] bg-lib-purple flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user?.avatarInitials || user?.fullName?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-foreground block truncate">{user?.fullName ?? 'Unknown User'}</span>
                <p className="text-xs text-muted-foreground truncate">{user?.email ?? 'No email set'}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-3 w-full px-4 py-3.5 border-b border-border hover:bg-lib-purple-50/50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="w-9 h-9 rounded-[14px] bg-lib-purple-50 dark:bg-white/10 flex items-center justify-center">
                <Lock className="w-4 h-4 text-lib-purple dark:text-lib-purple-300" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-sm font-medium text-foreground">Change Password</span>
                <p className="text-xs text-muted-foreground">Update your account password</p>
              </div>
              <span className="text-xs text-muted-foreground">••••</span>
            </button>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-[14px] bg-lib-purple-50 dark:bg-white/10 flex items-center justify-center">
                <Mail className="w-4 h-4 text-lib-purple dark:text-lib-purple-300" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-foreground">Email</span>
                <p className="text-xs text-muted-foreground">{user?.email ?? 'No email set'}</p>
              </div>
              <span className="text-xs text-lib-purple dark:text-lib-purple-300 font-medium">Verified</span>
            </div>
          </div>
        </motion.div>

        {/* Notifications section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="text-xs font-semibold text-lib-purple dark:text-lib-purple-300 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5" />
            Notifications
          </h3>
          <div className="bg-card rounded-[22px] dark:shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[14px] bg-lib-purple-50 dark:bg-white/10 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-lib-purple dark:text-lib-purple-300" />
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">Due Date Reminders</span>
                  <p className="text-xs text-muted-foreground">Get reminded before books are due</p>
                </div>
              </div>
              <Switch
                checked={dueDateNotif}
                onCheckedChange={(v) => handleToggle('notificationDueDate', v)}
                className="data-[state=checked]:bg-lib-purple"
              />
            </div>
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[14px] bg-lib-purple-50 dark:bg-white/10 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-lib-purple dark:text-lib-purple-300" />
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">Reservation Alerts</span>
                  <p className="text-xs text-muted-foreground">When reserved books are available</p>
                </div>
              </div>
              <Switch
                checked={reservationNotif}
                onCheckedChange={(v) => handleToggle('notificationReservation', v)}
                className="data-[state=checked]:bg-lib-purple"
              />
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[14px] bg-lib-purple-50 dark:bg-white/10 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-lib-purple dark:text-lib-purple-300" />
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">System Announcements</span>
                  <p className="text-xs text-muted-foreground">Updates and news from the library</p>
                </div>
              </div>
              <Switch
                checked={announcementNotif}
                onCheckedChange={(v) => handleToggle('notificationAnnouncements', v)}
                className="data-[state=checked]:bg-lib-purple"
              />
            </div>
          </div>
        </motion.div>

        {/* Appearance section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h3 className="text-xs font-semibold text-lib-purple dark:text-lib-purple-300 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" />
            Appearance
          </h3>
          <div className="bg-card rounded-[22px] dark:shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[14px] bg-lib-purple-50 dark:bg-white/10 flex items-center justify-center">
                  {theme === 'dark' ? <Moon className="w-4 h-4 text-lib-purple dark:text-lib-purple-300" /> : <Sun className="w-4 h-4 text-lib-purple dark:text-lib-purple-300" />}
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">Dark Mode</span>
                  <p className="text-xs text-muted-foreground">Switch between light and dark theme</p>
                </div>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                className="data-[state=checked]:bg-lib-purple"
              />
            </div>
          </div>
        </motion.div>

        {/* Help section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="text-xs font-semibold text-lib-purple dark:text-lib-purple-300 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            Help
          </h3>
          <div className="bg-card rounded-[22px] dark:shadow-sm overflow-hidden">
            <button
              onClick={() => {/* TODO: Open help guide */}}
              className="flex items-center gap-3 w-full px-4 py-3.5 border-b border-border hover:bg-lib-purple-50/50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="w-9 h-9 rounded-[14px] bg-lib-purple-50 dark:bg-white/10 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-lib-purple dark:text-lib-purple-300" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-sm font-medium text-foreground">How to use CCC&apos;s Library Logbook MS</span>
                <p className="text-xs text-muted-foreground">Learn how to navigate the system</p>
              </div>
              <div className="flex items-center gap-1 text-lib-purple dark:text-lib-purple-300 text-xs font-medium">
                Open Help guide
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-3.5 border-b border-border hover:bg-lib-purple-50/50 dark:hover:bg-white/5 transition-colors">
              <div className="w-9 h-9 rounded-[14px] bg-lib-purple-50 dark:bg-white/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-lib-purple dark:text-lib-purple-300" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-sm font-medium text-foreground">Privacy Policy</span>
                <p className="text-xs text-muted-foreground">How we protect your data</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-lib-purple-50/50 dark:hover:bg-white/5 transition-colors">
              <div className="w-9 h-9 rounded-[14px] bg-lib-purple-50 dark:bg-white/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-lib-purple dark:text-lib-purple-300" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-sm font-medium text-foreground">Terms of Service</span>
                <p className="text-xs text-muted-foreground">Usage terms and conditions</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </motion.div>

        {/* About section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h3 className="text-xs font-semibold text-lib-purple dark:text-lib-purple-300 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            About
          </h3>
          <div className="bg-card rounded-[22px] dark:shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[14px] bg-lib-purple-50 dark:bg-white/10 flex items-center justify-center">
                  <Info className="w-4 h-4 text-lib-purple dark:text-lib-purple-300" />
                </div>
                <span className="text-sm font-medium text-foreground">App Version</span>
              </div>
              <span className="text-xs text-muted-foreground">1.0.0</span>
            </div>
          </div>
        </motion.div>

        {/* Log Out button */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 rounded-[22px] py-6 text-sm font-semibold"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </motion.div>

        <div className="h-24" />
      </div>

      {/* Password Change Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={(e) => { if (e.target === e.currentTarget) setShowPasswordModal(false) }}
          >
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-card rounded-t-[22px] w-full max-w-[430px] p-6 pb-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle bar */}
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20 mx-auto mb-4" />
              
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[14px] bg-lib-purple-50 dark:bg-white/10 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-lib-purple dark:text-lib-purple-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Change Password</h3>
                    <p className="text-xs text-muted-foreground">Update your account security</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="currentPwd" className="text-sm font-medium">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPwd"
                      type={showCurrentPwd ? 'text' : 'password'}
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="h-11 rounded-[14px] border-gray-200 dark:border-white/10 focus:border-lib-purple focus:ring-lib-purple/20 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-lib-purple dark:hover:text-lib-purple-300 transition-colors"
                    >
                      {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPwd" className="text-sm font-medium">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPwd"
                      type={showNewPwd ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-11 rounded-[14px] border-gray-200 dark:border-white/10 focus:border-lib-purple focus:ring-lib-purple/20 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-lib-purple dark:hover:text-lib-purple-300 transition-colors"
                    >
                      {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map(i => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              i <= strength.level ? strength.color : 'bg-gray-200 dark:bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{strength.label}</p>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmNewPwd" className="text-sm font-medium">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmNewPwd"
                      type={showConfirmPwd ? 'text' : 'password'}
                      placeholder="Re-enter new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="h-11 rounded-[14px] border-gray-200 dark:border-white/10 focus:border-lib-purple focus:ring-lib-purple/20 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-lib-purple dark:hover:text-lib-purple-300 transition-colors"
                    >
                      {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmNewPassword.length > 0 && confirmNewPassword !== newPassword && (
                    <p className="text-xs text-red-500">Passwords do not match</p>
                  )}
                  {confirmNewPassword.length > 0 && confirmNewPassword === newPassword && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Passwords match
                    </p>
                  )}
                </div>

                {/* Error message */}
                {passwordError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-[14px] p-3 text-xs text-red-600 dark:text-red-400"
                  >
                    {passwordError}
                  </motion.div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 h-11 rounded-[14px] border-gray-200 dark:border-white/10 text-sm font-medium"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleChangePassword}
                    disabled={changingPassword || !currentPassword || !newPassword || !confirmNewPassword}
                    className="flex-1 h-11 rounded-[14px] bg-lib-purple hover:bg-lib-purple-dark text-white text-sm font-semibold disabled:opacity-50"
                  >
                    {changingPassword ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Changing...
                      </span>
                    ) : 'Change Password'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
