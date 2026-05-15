'use client'

import { useAppStore } from '@/lib/store'
import { BookOpen, Eye, EyeOff, Loader2, GraduationCap, Library, BookMarked, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

export default function LoginScreen() {
  const { setUser, setCurrentScreen, resetOnboarding } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const { toast } = useToast()

  // Check if email is valid for button glow effect
  const isValidEmail = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }, [email])

  const handleLogin = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Login Failed', description: data.error || 'Invalid credentials', variant: 'destructive' })
        return
      }
      setUser({
        id: data.id,
        fullName: data.fullName,
        email: data.email,
        universityId: data.universityId,
        role: data.role,
        program: data.program || '',
        department: data.department || '',
        yearLevel: data.yearLevel || '',
        avatarInitials: data.avatarInitials,
        streakCount: data.streakCount || 0,
        isOnboarded: data.isOnboarded,
        notificationDueDate: data.notificationDueDate,
        notificationReservation: data.notificationReservation,
        notificationAnnouncements: data.notificationAnnouncements,
      })
      setCurrentScreen('home')
    } catch {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = () => {
    resetOnboarding()
    setCurrentScreen('onboarding')
  }

  const handleDemoLogin = () => {
    setEmail('juan@university.edu')
    setPassword('password123')
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0d0618] relative overflow-hidden">
      {/* Animated gradient background with floating icons — living gradient */}
      <div className="relative bg-purple-gradient px-6 pt-14 pb-20 rounded-b-[2.5rem] overflow-hidden">
        {/* Living gradient overlay — slowly shifts colors like a living background */}
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'linear-gradient(135deg, rgba(155,91,191,0.4) 0%, transparent 40%, rgba(184,125,212,0.3) 70%, transparent 100%)',
              'linear-gradient(135deg, transparent 0%, rgba(155,91,191,0.3) 30%, rgba(101,45,144,0.4) 60%, transparent 100%)',
              'linear-gradient(135deg, rgba(184,125,212,0.3) 0%, transparent 30%, rgba(155,91,191,0.5) 70%, transparent 100%)',
              'linear-gradient(135deg, rgba(155,91,191,0.4) 0%, transparent 40%, rgba(184,125,212,0.3) 70%, transparent 100%)',
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ opacity: 0.35 }}
        />
        {/* Secondary slow-moving gradient layer for depth */}
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'radial-gradient(ellipse at 20% 50%, rgba(184,125,212,0.2) 0%, transparent 50%)',
              'radial-gradient(ellipse at 80% 30%, rgba(101,45,144,0.3) 0%, transparent 50%)',
              'radial-gradient(ellipse at 40% 70%, rgba(155,91,191,0.2) 0%, transparent 50%)',
              'radial-gradient(ellipse at 20% 50%, rgba(184,125,212,0.2) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          style={{ opacity: 0.5 }}
        />

        {/* Decorative floating book icons */}
        <div className="absolute top-8 left-4 animate-float-icon" style={{ animationDelay: '0s' }}>
          <BookMarked className="w-6 h-6 text-white/10" />
        </div>
        <div className="absolute top-16 right-8 animate-float-icon" style={{ animationDelay: '1.5s' }}>
          <Bookmark className="w-5 h-5 text-white/8" />
        </div>
        <div className="absolute top-28 left-12 animate-float-icon" style={{ animationDelay: '3s' }}>
          <BookOpen className="w-4 h-4 text-white/6" />
        </div>
        <div className="absolute bottom-16 right-4 animate-float-icon" style={{ animationDelay: '2s' }}>
          <Library className="w-7 h-7 text-white/6" />
        </div>
        <div className="absolute bottom-24 left-8 animate-float-icon" style={{ animationDelay: '4s' }}>
          <BookMarked className="w-5 h-5 text-white/8" />
        </div>

        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute top-20 right-10 w-20 h-20 rounded-full bg-white/5" />

        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center relative z-10"
        >
          {/* App logo with continuous subtle glow pulse */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4 ring-1 ring-white/20"
            style={{ boxShadow: '0 0 0 0 rgba(255,255,255,0)' }}
          >
            {/* Glow pulse ring — continuous subtle glow */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(255,255,255,0.15)',
                  '0 0 20px 8px rgba(155,91,191,0.3)',
                  '0 0 0 0 rgba(255,255,255,0.15)',
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <BookOpen className="w-10 h-10 text-white relative z-10" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-white tracking-tight"
          >
            LibLog
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white/60 text-sm mt-1 flex items-center gap-1.5"
          >
            <Library className="w-3.5 h-3.5" />
            Digital Library Logbook System
          </motion.p>
        </motion.div>
      </div>

      {/* Form card */}
      <div className="flex-1 px-6 -mt-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#1a0e2e] rounded-2xl dark:shadow-xl p-6 ring-1 ring-black/5 dark:ring-white/5 glass-card"
        >
          <h2 className="text-lg font-bold text-foreground mb-1">Welcome back</h2>
          <p className="text-xs text-muted-foreground mb-5">Sign in to your account</p>
          <div className="space-y-4">
            {/* Email field with animated label */}
            <div className="space-y-2">
              <Label
                htmlFor="loginEmail"
                className={`text-sm font-medium transition-colors duration-200 ${
                  emailFocused ? 'text-lib-purple dark:text-lib-purple-300' : 'text-foreground'
                }`}
              >
                Email
              </Label>
              <div className="relative">
                <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                  emailFocused ? 'text-lib-purple dark:text-lib-purple-300' : 'text-muted-foreground'
                }`}>
                  <GraduationCap className="w-4 h-4" />
                </div>
                <Input
                  id="loginEmail"
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  className={`h-12 pl-10 rounded-xl transition-all duration-200 ${
                    emailFocused
                      ? 'border-lib-purple ring-2 ring-lib-purple/20 dark:shadow-sm dark:shadow-lib-purple/5'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                />
              </div>
            </div>

            {/* Password field with animated label */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="loginPassword"
                  className={`text-sm font-medium transition-colors duration-200 ${
                    passwordFocused ? 'text-lib-purple dark:text-lib-purple-300' : 'text-foreground'
                  }`}
                >
                  Password
                </Label>
                <button className="text-xs text-lib-purple dark:text-lib-purple-300 font-medium hover:text-lib-purple-dark transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="loginPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  className={`h-12 rounded-xl transition-all duration-200 pr-10 ${
                    passwordFocused
                      ? 'border-lib-purple ring-2 ring-lib-purple/20 dark:shadow-sm dark:shadow-lib-purple/5'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-lib-purple dark:hover:text-lib-purple-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login button with gradient, loading animation, and valid email glow */}
            <Button
              onClick={handleLogin}
              disabled={loading || !email || !password}
              className="w-full h-12 rounded-xl bg-lib-purple hover:bg-lib-purple-dark text-white font-semibold text-base disabled:opacity-50 dark:shadow-lg dark:shadow-lib-purple/25 active:scale-[0.98] transition-all relative overflow-hidden"
              style={isValidEmail && !loading ? {
                boxShadow: '0 0 20px 4px rgba(101, 45, 144, 0.35), 0 4px 14px -2px rgba(101, 45, 144, 0.25)',
              } : undefined}
            >
              {/* Glow effect when email is valid */}
              {isValidEmail && !loading && (
                <motion.div
                  className="absolute inset-0 rounded-xl"
                  animate={{
                    boxShadow: [
                      '0 0 15px 2px rgba(101, 45, 144, 0.3)',
                      '0 0 25px 6px rgba(101, 45, 144, 0.45)',
                      '0 0 15px 2px rgba(101, 45, 144, 0.3)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 relative z-10"
                  >
                    <div className="relative w-5 h-5">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                    <span>Signing in...</span>
                  </motion.div>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative z-10"
                  >
                    Sign In
                  </motion.span>
                )}
              </AnimatePresence>
              {/* Shimmer effect on button when not loading */}
              {!loading && (email && password) && (
                <div className="absolute inset-0 shimmer-loading rounded-xl" />
              )}
            </Button>
          </div>

          {/* Demo login */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-[#1a0e2e] px-3 text-muted-foreground">or</span>
            </div>
          </div>

          <button
            onClick={handleDemoLogin}
            className="w-full py-3 rounded-xl border-2 border-dashed border-lib-purple-200 dark:border-lib-purple-700 bg-lib-purple-50/50 dark:bg-lib-purple-900/20 text-lib-purple dark:text-lib-purple-300 text-sm font-medium hover:bg-lib-purple-50 dark:hover:bg-lib-purple-900/30 hover:border-lib-purple-300 dark:hover:border-lib-purple-600 active:bg-lib-purple-100 dark:active:bg-lib-purple-900/40 transition-all press-effect"
          >
            <span className="flex items-center justify-center gap-2">
              <BookOpen className="w-4 h-4" />
              Use Demo Account
            </span>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <button
              onClick={handleRegister}
              className="text-lib-purple dark:text-lib-purple-300 font-semibold hover:text-lib-purple-dark transition-colors"
            >
              Register
            </button>
          </p>
        </motion.div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-muted-foreground/60">
            By signing in, you agree to our Terms of Service & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
