import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const reservations = await db.reservation.findMany({
      where: { userId },
      include: { resource: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(reservations)
  } catch (error) {
    console.error('Get reservations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
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

    // Check if resource exists
    const resource = await db.resource.findUnique({ where: { id: resourceId } })
    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Check if already has a pending reservation for this resource
    const existingReservation = await db.reservation.findFirst({
      where: { userId, resourceId, status: 'pending' },
    })

    if (existingReservation) {
      return NextResponse.json(
        { error: 'Already have a pending reservation for this resource' },
        { status: 400 }
      )
    }

    const reservation = await db.reservation.create({
      data: {
        userId,
        resourceId,
        status: 'pending',
      },
    })

    return NextResponse.json(reservation, { status: 201 })
  } catch (error) {
    console.error('Create reservation error:', error)
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    )
  }
}
