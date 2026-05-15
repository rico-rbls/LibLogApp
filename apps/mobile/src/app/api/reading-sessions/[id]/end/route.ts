import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await db.readingSession.findUnique({ where: { id } })
    if (!session) {
      return NextResponse.json(
        { error: 'Reading session not found' },
        { status: 404 }
      )
    }

    if (session.status === 'ended') {
      return NextResponse.json(
        { error: 'Reading session already ended' },
        { status: 400 }
      )
    }

    const now = new Date()

    // End reading session and increment available copies
    const result = await db.$transaction([
      db.readingSession.update({
        where: { id },
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

    const startTime = session.startTime
    const durationMs = now.getTime() - startTime.getTime()
    const durationMinutes = Math.round(durationMs / (1000 * 60))

    return NextResponse.json({
      session: result[0],
      durationMinutes,
    })
  } catch (error) {
    console.error('End reading session error:', error)
    return NextResponse.json(
      { error: 'Failed to end reading session' },
      { status: 500 }
    )
  }
}
