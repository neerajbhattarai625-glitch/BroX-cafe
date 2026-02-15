import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const reviews = await prisma.review.findMany({
            orderBy: { createdAt: 'desc' }
        });

        const formattedReviews = reviews.map((rev) => ({
            ...rev,
            time: rev.createdAt.toLocaleDateString()
        }));

        return NextResponse.json(formattedReviews);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, rating, comment } = body;

        const newReview = await prisma.review.create({
            data: {
                name,
                rating,
                comment
            }
        });

        return NextResponse.json({
            ...newReview,
            time: newReview.createdAt.toLocaleDateString()
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
    }
}
