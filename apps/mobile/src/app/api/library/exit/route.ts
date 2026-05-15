import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const today = new Date().toISOString().split('T')[0]

    // 1. Time-out attendance for today
    let attendanceResult = null
    const existingAttendance = await db.attendance.findFirst({
      where: { userId, date: today, timeOut: null },
    })

    if (existingAttendance) {
      const now = new Date()
      const timeIn = existingAttendance.timeIn!
      const durationMs = now.getTime() - timeIn.getTime()
      const durationMinutes = Math.round(durationMs / (1000 * 60))

      attendanceResult = await db.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          timeOut: now,
          duration: durationMinutes,
        },
      })
    }

    // 2. End all active reading sessions (in-library reading)
    const activeReadingSessions = await db.readingSession.findMany({
      where: { userId, status: 'active' },
      include: { resource: true },
    })

    const endedReadingSessions: { id: string; title: string; author: string; durationMinutes: number }[] = []
    const now = new Date()

    for (const session of activeReadingSessions) {
      const durationMs = now.getTime() - session.startTime.getTime()
      const durationMinutes = Math.round(durationMs / (1000 * 60))

      await db.$transaction([
        db.readingSession.update({
          where: { id: session.id },
          data: {
            endTime: now,
            status: 'ended',
          },
        }),
        db.resource.update({
          where: { id: session.resourceId },
          data: { availableCopies: { increment: 1 } },
        }),
      ])

      endedReadingSessions.push({
        id: session.resource.id,
        title: session.resource.title,
        author: session.resource.author,
        durationMinutes,
      })
    }

    // 3. Find all active/overdue borrowed books (outside borrowing)
    const activeBorrows = await db.borrowRecord.findMany({
      where: {
        userId,
        status: { in: ['active', 'overdue'] },
      },
      include: { resource: true },
    })

    // 4. Return all active borrowed books
    const returnedBooks: { id: string; title: string; author: string }[] = []

    for (const borrow of activeBorrows) {
      const isLate = now > new Date(borrow.dueDate)

      await db.$transaction([
        db.borrowRecord.update({
          where: { id: borrow.id },
          data: {
            status: 'returned',
            returnDate: now,
            isLate,
          },
        }),
        db.resource.update({
          where: { id: borrow.resourceId },
          data: { availableCopies: { increment: 1 } },
        }),
      ])

      returnedBooks.push({
        id: borrow.resource.id,
        title: borrow.resource.title,
        author: borrow.resource.author,
      })
    }

    return NextResponse.json({
      attendance: attendanceResult
        ? { timedOut: true, duration: attendanceResult.duration }
        : { timedOut: false, message: 'No active attendance record found for today' },
      endedReadingSessions,
      totalReadingSessionsEnded: endedReadingSessions.length,
      returnedBooks,
      totalReturned: returnedBooks.length,
    })
  } catch (error) {
    console.error('Library exit error:', error)
    return NextResponse.json(
      { error: 'Failed to process library exit' },
      { status: 500 }
    )
  }
}
