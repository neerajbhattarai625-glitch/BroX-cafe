import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

const DEFAULT_PASSWORDS: Record<string, string> = {
    'admin': 'admin123',
    'staff': 'staff123',
    'chef': 'chef123',
    'counter': 'counter123'
};

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const authCookie = cookieStore.get("auth_token");

        if (!authCookie) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Verify admin access
        let isAdmin = false;
        if (authCookie.value === "admin_token") {
            isAdmin = true;
        } else {
            const user = await prisma.user.findUnique({
                where: { id: authCookie.value }
            });
            if (user && user.role === 'ADMIN') {
                isAdmin = true;
            }
        }

        if (!isAdmin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { username } = body;

        if (!username) {
            return NextResponse.json({ error: 'Username required' }, { status: 400 });
        }

        const defaultPassword = DEFAULT_PASSWORDS[username];
        if (!defaultPassword) {
            return NextResponse.json({ error: 'Unknown user type' }, { status: 400 });
        }

        // Check if user exists in DB
        const existingUser = await prisma.user.findUnique({ where: { username } });

        if (existingUser) {
            // Reset to default password
            await prisma.user.update({
                where: { username },
                data: { password: defaultPassword }
            });
        } else {
            // User doesn't exist in DB yet (using hardcoded credentials)
            // Create them with default password
            const role = username === 'admin' ? 'ADMIN' :
                username === 'counter' ? 'COUNTER' : 'STAFF';

            await prisma.user.create({
                data: {
                    username,
                    password: defaultPassword,
                    role
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: `Password reset to default for ${username}`,
            defaultPassword
        });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
    }
}
