import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, getAvatarInitials } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      fullName,
      email,
      password,
      universityId,
      role,
      program,
      department,
      yearLevel,
      notificationDueDate,
      notificationReservation,
    } = body

    // Validate required fields
    if (!fullName || !email || !password || !universityId) {
      return NextResponse.json(
        { error: 'Full name, email, password, and university ID are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Check if universityId already exists
    const existingUniId = await db.user.findUnique({ where: { universityId } })
    if (existingUniId) {
      return NextResponse.json(
        { error: 'University ID already registered' },
        { status: 409 }
      )
    }

    const hashedPassword = hashPassword(password)
    const avatarInitials = getAvatarInitials(fullName)

    const user = await db.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        universityId,
        role: role || 'student',
        program: program || null,
        department: department || null,
        yearLevel: yearLevel || null,
        avatarInitials,
        notificationDueDate: notificationDueDate ?? true,
        notificationReservation: notificationReservation ?? true,
        isOnboarded: true,
      },
    })

    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    )
  }
}
