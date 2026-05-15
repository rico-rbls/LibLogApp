import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Find the borrow record
    const record = await db.borrowRecord.findUnique({
      where: { id },
      include: { resource: true },
    })

    if (!record) {
      return NextResponse.json(
        { error: 'Borrow record not found' },
        { status: 404 }
      )
    }

    if (record.status === 'returned') {
      return NextResponse.json(
        { error: 'Book already returned' },
        { status: 400 }
      )
    }

    const now = new Date()
    const isLate = now > record.dueDate

    // Update borrow record and increment available copies in transaction
    const updated = await db.$transaction([
      db.borrowRecord.update({
        where: { id },
        data: {
          returnDate: now,
          status: 'returned',
          isLate,
        },
      }),
      db.resource.update({
        where: { id: record.resourceId },
        data: { availableCopies: { increment: 1 } },
      }),
    ])

    return NextResponse.json(updated[0])
  } catch (error) {
    console.error('Return book error:', error)
    return NextResponse.json(
      { error: 'Failed to return book' },
      { status: 500 }
    )
  }
}
