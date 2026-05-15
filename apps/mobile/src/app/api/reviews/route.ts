import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const resourceId = searchParams.get('resourceId');

  if (!resourceId) {
    return NextResponse.json({ error: 'resourceId is required' }, { status: 400 });
  }

  const reviews = await db.review.findMany({
    where: { resourceId },
    include: {
      user: {
        select: { id: true, fullName: true, avatarInitials: true, role: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  // Rating distribution
  const distribution = [0, 0, 0, 0, 0]; // index 0 = 1 star, index 4 = 5 stars
  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) {
      distribution[r.rating - 1]++;
    }
  });

  return NextResponse.json({
    reviews,
    stats: {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      distribution,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, resourceId, rating, comment } = body;

    if (!userId || !resourceId || !rating) {
      return NextResponse.json(
        { error: 'userId, resourceId, and rating are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Verify user and resource exist
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const resource = await db.resource.findUnique({ where: { id: resourceId } });
    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Upsert review (one per user per resource)
    const review = await db.review.upsert({
      where: {
        userId_resourceId: { userId, resourceId },
      },
      update: {
        rating,
        comment: comment || null,
      },
      create: {
        userId,
        resourceId,
        rating,
        comment: comment || null,
      },
      include: {
        user: {
          select: { id: true, fullName: true, avatarInitials: true, role: true },
        },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
