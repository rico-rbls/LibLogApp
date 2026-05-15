import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    let settings = await db.librarySettings.findFirst()

    if (!settings) {
      // Create default settings if none exist
      settings = await db.librarySettings.create({
        data: {
          isOpen: true,
          closingTime: '21:00',
          openingTime: '07:00',
          maxBorrowStudent: 3,
          maxBorrowFaculty: 10,
          maxBorrowVisitor: 1,
          borrowDaysStudent: 14,
          borrowDaysFaculty: 30,
          borrowDaysVisitor: 7,
          qrValidityMinutes: 15,
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    let settings = await db.librarySettings.findFirst()

    if (!settings) {
      settings = await db.librarySettings.create({ data: body })
    } else {
      settings = await db.librarySettings.update({
        where: { id: settings.id },
        data: body,
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
