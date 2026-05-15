import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, currentPassword, newPassword, ...updates } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to change password' },
          { status: 400 }
        )
      }

      // Fetch the user to verify current password
      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // Verify current password
      if (!verifyPassword(currentPassword, user.password)) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 401 }
        )
      }

      // Hash and update the new password
      const hashedNewPassword = hashPassword(newPassword)
      const updatedUser = await db.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      })

      const { password: _, ...userWithoutPassword } = updatedUser
      return NextResponse.json(userWithoutPassword)
    }

    // Only allow specific fields to be updated
    const allowedFields = [
      'fullName',
      'email',
      'program',
      'department',
      'yearLevel',
      'notificationDueDate',
      'notificationReservation',
      'notificationAnnouncements',
      'isOnboarded',
    ]

    const filteredUpdates: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in updates) {
        filteredUpdates[key] = updates[key]
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const user = await db.user.update({
      where: { id: userId },
      data: filteredUpdates,
    })

    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}
