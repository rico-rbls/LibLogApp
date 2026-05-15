import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { getBorrowDays, getMaxBorrow } from '@/lib/auth'

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

    const where: Prisma.BorrowRecordWhereInput = { userId }
    if (status) {
      where.status = status
    }

    const records = await db.borrowRecord.findMany({
      where,
      include: { resource: true },
      orderBy: { borrowDate: 'desc' },
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error('Get borrow records error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch borrow records' },
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

    // Get library settings
    const settings = await db.librarySettings.findFirst()
    if (!settings) {
      return NextResponse.json(
        { error: 'Library settings not configured' },
        { status: 500 }
      )
    }

    // Check borrowing limits
    const activeBorrows = await db.borrowRecord.count({
      where: {
        userId,
        status: { in: ['active', 'overdue'] },
      },
    })

    const maxBorrow = getMaxBorrow(user.role, settings)
    if (activeBorrows >= maxBorrow) {
      return NextResponse.json(
        { error: `Borrowing limit reached (${maxBorrow} books for ${user.role})` },
        { status: 400 }
      )
    }

    // Calculate due date
    const borrowDays = getBorrowDays(user.role, settings)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + borrowDays)

    // Create borrow record and update resource in transaction
    const record = await db.$transaction([
      db.borrowRecord.create({
        data: {
          userId,
          resourceId,
          dueDate,
          status: 'active',
        },
      }),
      db.resource.update({
        where: { id: resourceId },
        data: { availableCopies: { decrement: 1 } },
      }),
    ])

    return NextResponse.json(record[0], { status: 201 })
  } catch (error) {
    console.error('Create borrow record error:', error)
    return NextResponse.json(
      { error: 'Failed to create borrow record' },
      { status: 500 }
    )
  }
}
