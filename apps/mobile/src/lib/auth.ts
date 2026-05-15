import { createHash } from 'crypto'

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword
}

export function getAvatarInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return fullName.substring(0, 2).toUpperCase()
}

export function getBorrowDays(role: string, settings: { borrowDaysStudent: number; borrowDaysFaculty: number; borrowDaysVisitor: number }): number {
  switch (role) {
    case 'faculty':
      return settings.borrowDaysFaculty
    case 'visitor':
      return settings.borrowDaysVisitor
    default:
      return settings.borrowDaysStudent
  }
}

export function getMaxBorrow(role: string, settings: { maxBorrowStudent: number; maxBorrowFaculty: number; maxBorrowVisitor: number }): number {
  switch (role) {
    case 'faculty':
      return settings.maxBorrowFaculty
    case 'visitor':
      return settings.maxBorrowVisitor
    default:
      return settings.maxBorrowStudent
  }
}
