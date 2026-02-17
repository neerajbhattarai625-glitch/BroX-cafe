import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request) {
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
                return NextResponse.json({ error: 'Only admins can update usernames' }, { status: 403 });
            }
        }

        const body = await request.json();
        const { userId, username, displayName } = body;

        if (!userId || !displayName || !username) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if username already exists for OTHER users
        if (username) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    username,
                    id: { not: userId }
                }
            });
            if (existingUser) {
                return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
            }
        }

        // Fetch settings to check limit (only if name/username changes or roles added)
        const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
        const userCount = await prisma.user.count({ where: { role: { not: 'ADMIN' } } });

        // Update user & Invalidate sessions
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                username: username.trim(),
                displayName: displayName.trim(),
                sessionVersion: { increment: 1 } // Forced logout
            }
        });

        return NextResponse.json({
            success: true,
            message: 'User updated and sessions invalidated',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update username error:', error);
        return NextResponse.json({ error: 'Failed to update username' }, { status: 500 });
    }
}
