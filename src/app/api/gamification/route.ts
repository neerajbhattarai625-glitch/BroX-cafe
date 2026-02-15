
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { deviceId } = body;

        if (!deviceId) {
            return NextResponse.json({ error: 'Device ID required' }, { status: 400 });
        }

        // Upsert device stats: create if not exists, increment visits if exists
        const stats = await prisma.deviceStats.upsert({
            where: { deviceId },
            create: {
                deviceId,
                totalVisits: 1,
                lastVisit: new Date(),
            },
            update: {
                totalVisits: { increment: 1 },
                lastVisit: new Date(),
            },
        });

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Error tracking visit:", error);
        return NextResponse.json({ error: 'Failed to track visit' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const deviceId = searchParams.get('deviceId');

        if (!deviceId) {
            return NextResponse.json({ error: 'Device ID required' }, { status: 400 });
        }

        const stats = await prisma.deviceStats.findUnique({
            where: { deviceId }
        });

        // Calculate eligible rewards here or in UI?
        // Let's return stats and maybe available rewards

        const rewards = await prisma.reward.findMany({
            where: { isActive: true },
            orderBy: { cost: 'asc' }
        });

        return NextResponse.json({ stats, rewards });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
