import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { calculateTier } from '@/lib/tier-system';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { deviceId, type, amount } = body; // Added type and amount

        if (!deviceId) {
            return NextResponse.json({ error: 'Device ID required' }, { status: 400 });
        }

        // Find or create device stats
        let deviceStats = await prisma.deviceStats.findUnique({
            where: { deviceId }
        });

        if (!deviceStats) {
            // Create new device stats if not found
            deviceStats = await prisma.deviceStats.create({
                data: {
                    deviceId,
                    totalVisits: 0, // Will be incremented if type is VISIT
                    totalSpend: 0,
                    totalPoints: 0,
                    tier: 'BRONZE',
                    lastVisit: new Date(),
                }
            });
        }

        if (type === 'VISIT') {
            // Only count visit if 24h passed OR strictly new (not implementation here yet)
            // For now, always increment visit
            deviceStats = await prisma.deviceStats.update({
                where: { deviceId },
                data: {
                    totalVisits: { increment: 1 },
                    lastVisit: new Date()
                }
            })
        } else if (type === 'SPEND' && amount) {
            // Get rate from settings
            const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
            const rate = settings?.pointRate ?? 1.5;
            const pointsEarned = amount * rate;

            deviceStats = await prisma.deviceStats.update({
                where: { deviceId },
                data: {
                    totalSpend: { increment: amount },
                    totalPoints: { increment: pointsEarned }
                }
            })
        }

        // Recalculate Tier
        const newTier = calculateTier(deviceStats.totalVisits, deviceStats.totalSpend);
        if (newTier !== deviceStats.tier) {
            await prisma.deviceStats.update({
                where: { deviceId },
                data: { tier: newTier }
            });
        }

        return NextResponse.json(deviceStats);
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
