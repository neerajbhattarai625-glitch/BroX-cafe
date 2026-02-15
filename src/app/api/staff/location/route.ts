import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { lat, lng } = await request.json();
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Decode token (simple JSON parse as per login implementation)
        const user = JSON.parse(token);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                lat,
                lng,
                lastActiveAt: new Date()
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
    }
}
