import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')

    const where: Prisma.AttendanceWhereInput = {}
    if (userId) where.userId = userId
    if (date) where.date = date

    const records = await db.attendance.findMany({
      where,
      include: { user: { select: { id: true, fullName: true, universityId: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error('Get attendance error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type } = body

    if (!userId || !type) {
      return NextResponse.json(
        { error: 'User ID and type (time-in/time-out) are required' },
        { status: 400 }
      )
    }

    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    if (type === 'time-in') {
      // Check if already timed in today
      const existingRecord = await db.attendance.findFirst({
        where: { userId, date: today, timeOut: null },
      })

      if (existingRecord) {
        return NextResponse.json(
          { error: 'Already timed in today', record: existingRecord },
          { status: 400 }
        )
      }

      const record = await db.attendance.create({
        data: {
          userId,
          date: today,
          timeIn: new Date(),
        },
      })

      return NextResponse.json(record, { status: 201 })
    }

    if (type === 'time-out') {
      // Find today's open attendance record
      const existingRecord = await db.attendance.findFirst({
        where: { userId, date: today, timeOut: null },
      })

      if (!existingRecord) {
        return NextResponse.json(
          { error: 'No active time-in record found for today' },
          { status: 404 }
        )
      }

      const now = new Date()
      const timeIn = existingRecord.timeIn!
      const durationMs = now.getTime() - timeIn.getTime()
      const durationMinutes = Math.round(durationMs / (1000 * 60))

      const updated = await db.attendance.update({
        where: { id: existingRecord.id },
        data: {
          timeOut: now,
          duration: durationMinutes,
        },
      })

      return NextResponse.json(updated)
    }

    return NextResponse.json(
      { error: 'Invalid type. Use "time-in" or "time-out"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Attendance error:', error)
    return NextResponse.json(
      { error: 'Failed to log attendance' },
      { status: 500 }
    )
  }
}
