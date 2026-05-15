import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const resource = await db.resource.findUnique({
      where: { id },
      include: {
        borrowRecords: {
          where: { status: { in: ['active', 'overdue'] } },
          take: 5,
          orderBy: { borrowDate: 'desc' },
        },
        reservations: {
          where: { status: 'pending' },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(resource)
  } catch (error) {
    console.error('Get resource error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch resource' },
      { status: 500 }
    )
  }
}
