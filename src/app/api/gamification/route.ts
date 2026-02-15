import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { calculateTier } from '@/lib/tier-system';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { deviceId, totalSpend } = body;

        if (!deviceId) {
            return NextResponse.json({ error: 'Device ID required' }, { status: 400 });
        }

        // Upsert device stats: create if not exists, increment visits if exists
        const stats = await prisma.deviceStats.upsert({
            where: { deviceId },
            create: {
                deviceId,
                totalVisits: 1,
                totalSpend: totalSpend || 0,
                tier: 'BRONZE',
                lastVisit: new Date(),
            },
            update: {
                totalVisits: { increment: 1 },
                totalSpend: totalSpend ? { increment: totalSpend } : undefined,
                lastVisit: new Date(),
            },
        });

        // Calculate and update tier
        const newTier = calculateTier(stats.totalVisits, stats.totalSpend);
        if (newTier !== stats.tier) {
            await prisma.deviceStats.update({
                where: { deviceId },
                data: { tier: newTier }
            });
            stats.tier = newTier;
        }

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

        const rewards = await prisma.reward.findMany({
            where: { isActive: true },
            orderBy: { cost: 'asc' }
        });

        // Add tier progress if stats exist
        let tierProgress = null;
        if (stats) {
            const { getTierProgress } = await import('@/lib/tier-system');
            tierProgress = getTierProgress(stats.totalVisits, stats.totalSpend);
        }

        return NextResponse.json({ stats, rewards, tierProgress });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
