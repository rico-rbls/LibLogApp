'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, GraduationCap, User, Camera } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

const programs = [
  'Computer Science', 'Information Technology', 'Nursing', 'Psychology',
  'Business Administration', 'Engineering', 'Education', 'Biology',
  'Mathematics', 'English'
]
const departments = [
  'Computer Science', 'Information Technology', 'Mathematics', 'Physics',
  'Chemistry', 'Biology', 'English', 'Nursing'
]
const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']

export default function EditProfileScreen() {
  const { user, setUser, goBack } = useAppStore()
  const { toast } = useToast()

  const [fullName, setFullName] = useState(user?.fullName || '')
  const [program, setProgram] = useState(user?.program || '')
  const [department, setDepartment] = useState(user?.department || '')
  const [yearLevel, setYearLevel] = useState(user?.yearLevel || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast({ title: 'Error', description: 'Full name is required', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/auth/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          fullName: fullName.trim(),
          program: program || undefined,
          department: department || undefined,
          yearLevel: yearLevel || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Error', description: data.error || 'Failed to update profile', variant: 'destructive' })
        return
      }

      // Update store
      if (user) {
        setUser({
          ...user,
          fullName: data.fullName || fullName,
          program: data.program || program,
          department: data.department || department,
          yearLevel: data.yearLevel || yearLevel,
          avatarInitials: data.avatarInitials || user.avatarInitials,
        })
      }

      toast({ title: 'Profile Updated', description: 'Your profile has been saved successfully' })
      goBack()
    } catch {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="bg-purple-gradient px-4 pt-4 pb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

        <div className="flex items-center gap-3 mb-6 relative z-10">
          <button
            onClick={goBack}
            className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">Edit Profile</h1>
        </div>

        {/* Avatar */}
        <div className="flex justify-center relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20 }}
            className="relative"
          >
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold text-white border-2 border-white/30">
              {user?.avatarInitials || '??'}
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-lib-purple flex items-center justify-center border-2 border-white dark:border-background dark:shadow-sm">
              <Camera className="w-3.5 h-3.5 text-white" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 -mt-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-[22px] dark:shadow-sm border border-gray-100 dark:border-white/5 p-5 space-y-4"
        >
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Full Name
            </label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="h-11 rounded-xl border-gray-200 dark:border-white/10 dark:bg-[#1a0e2e] dark:text-gray-100 focus:border-lib-purple"
            />
          </div>

          {/* Email (readonly) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</label>
            <Input
              value={user?.email || ''}
              disabled
              className="h-11 rounded-xl bg-gray-50 dark:bg-white/5 dark:text-gray-400 border-gray-200 dark:border-white/10"
            />
            <p className="text-[10px] text-gray-400 dark:text-gray-500">Email cannot be changed</p>
          </div>

          {/* University ID (readonly) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">University ID</label>
            <Input
              value={user?.universityId || ''}
              disabled
              className="h-11 rounded-xl bg-gray-50 dark:bg-white/5 dark:text-gray-400 border-gray-200 dark:border-white/10"
            />
            <p className="text-[10px] text-gray-400 dark:text-gray-500">University ID cannot be changed</p>
          </div>

          {/* Program (for students) */}
          {user?.role !== 'visitor' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                {user?.role === 'faculty' ? 'Department' : 'Program'}
              </label>
              <select
                value={user?.role === 'faculty' ? department : program}
                onChange={(e) => {
                  if (user?.role === 'faculty') setDepartment(e.target.value)
                  else setProgram(e.target.value)
                }}
                className="w-full h-11 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a0e2e] dark:text-gray-100 px-3 text-sm focus:outline-none focus:border-lib-purple focus:ring-1 focus:ring-lib-purple/20"
              >
                <option value="">Select {user?.role === 'faculty' ? 'department' : 'program'}</option>
                {(user?.role === 'faculty' ? departments : programs).map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
          )}

          {/* Year Level (for students only) */}
          {user?.role === 'student' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Year Level</label>
              <div className="grid grid-cols-5 gap-2">
                {yearLevels.map((yl) => (
                  <button
                    key={yl}
                    onClick={() => setYearLevel(yl)}
                    className={`py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                      yearLevel === yl
                        ? 'bg-lib-purple text-white dark:shadow-sm'
                        : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                  >
                    {yl.replace(' Year', '')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 space-y-3 pb-24"
        >
          <Button
            onClick={handleSave}
            disabled={saving || !fullName.trim()}
            className="w-full h-12 rounded-xl bg-lib-purple hover:bg-lib-purple-dark text-white font-semibold text-base flex items-center justify-center gap-2"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={goBack}
            className="w-full h-12 rounded-xl border-gray-200 dark:border-white/10 dark:text-gray-300 font-medium text-base"
          >
            Cancel
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
