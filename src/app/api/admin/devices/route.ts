import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // 1. Get all tables with active sessions
        const tables = await prisma.table.findMany({
            where: {
                status: 'OPEN',
                deviceId: { not: null }
            },
            select: {
                id: true,
                number: true,
                deviceId: true,
                sessionStartedAt: true
            }
        });

        // 2. Get blocked devices
        const blockedDevices = await prisma.blockedDevice.findMany();
        const blockedSet = new Set(blockedDevices.map(d => d.deviceId));

        // 3. Merge data
        const devices = tables.map(t => ({
            tableNo: t.number,
            deviceId: t.deviceId,
            sessionStarted: t.sessionStartedAt,
            isBlocked: blockedSet.has(t.deviceId!)
        }));

        return NextResponse.json({ devices });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { deviceId, action } = await request.json();

        if (!deviceId) return NextResponse.json({ error: 'Device ID required' }, { status: 400 });

        if (action === 'BLOCK') {
            await prisma.blockedDevice.create({
                data: {
                    deviceId,
                    reason: 'Admin blocked via dashboard'
                }
            });
        } else if (action === 'UNBLOCK') {
            await prisma.blockedDevice.delete({
                where: { deviceId }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update device status' }, { status: 500 });
    }
}
