import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const where: Prisma.ReadingSessionWhereInput = { userId }
    if (status) {
      where.status = status
    }

    const sessions = await db.readingSession.findMany({
      where,
      include: { resource: true },
      orderBy: { startTime: 'desc' },
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Get reading sessions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reading sessions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, resourceId } = body

    if (!userId || !resourceId) {
      return NextResponse.json(
        { error: 'User ID and Resource ID are required' },
        { status: 400 }
      )
    }

    // Get user
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get resource
    const resource = await db.resource.findUnique({ where: { id: resourceId } })
    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    // Check if resource is available
    if (resource.availableCopies <= 0) {
      return NextResponse.json(
        { error: 'No available copies of this resource' },
        { status: 400 }
      )
    }

    // Check if user already has an active reading session for this book
    const existingSession = await db.readingSession.findFirst({
      where: { userId, resourceId, status: 'active' },
    })
    if (existingSession) {
      return NextResponse.json(
        { error: 'You already have an active reading session for this book', session: existingSession },
        { status: 400 }
      )
    }

    const today = new Date().toISOString().split('T')[0]

    // Create reading session and decrement available copies
    const result = await db.$transaction([
      db.readingSession.create({
        data: {
          userId,
          resourceId,
          date: today,
          status: 'active',
        },
      }),
      db.resource.update({
        where: { id: resourceId },
        data: { availableCopies: { decrement: 1 } },
      }),
    ])

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Create reading session error:', error)
    return NextResponse.json(
      { error: 'Failed to create reading session' },
      { status: 500 }
    )
  }
}
