import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const reservation = await db.reservation.findUnique({ where: { id } })
    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    const updated = await db.reservation.update({
      where: { id },
      data: { status: 'cancelled' },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Cancel reservation error:', error)
    return NextResponse.json({ error: 'Failed to cancel reservation' }, { status: 500 })
  }
}
