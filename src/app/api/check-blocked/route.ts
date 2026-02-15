import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const deviceId = cookieStore.get("device_id")?.value;

        if (!deviceId) return NextResponse.json({ blocked: false });

        const blocked = await prisma.blockedDevice.findUnique({
            where: { deviceId }
        });

        return NextResponse.json({ blocked: !!blocked, reason: blocked?.reason });
    } catch (error) {
        return NextResponse.json({ error: 'Check failed' }, { status: 500 });
    }
}
