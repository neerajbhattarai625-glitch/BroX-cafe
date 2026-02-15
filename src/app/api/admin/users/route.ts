import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const authCookie = cookieStore.get("auth_token");

        if (!authCookie) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Check if user is admin
        const isAdmin = authCookie.value === "admin_token";
        if (!isAdmin) {
            // Check if DB user is admin
            const user = await prisma.user.findUnique({
                where: { id: authCookie.value }
            });
            if (!user || user.role !== 'ADMIN') {
                return NextResponse.json({ error: 'Only admins can view users' }, { status: 403 });
            }
        }

        const users = await (prisma.user as any).findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                username: true,
                role: true,
                displayName: true,
                createdAt: true
            }
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Fetch users error:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}
