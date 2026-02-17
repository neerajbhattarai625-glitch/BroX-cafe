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

        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                username: true,
                role: true,
                displayName: true,
                createdAt: true,
                sessionVersion: true
            }
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Fetch users error:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const authCookie = cookieStore.get("auth_token");

        if (!authCookie) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { username, password, role, displayName } = body;

        if (!username || !password || !role) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Check if username already exists
        const existingUser = await prisma.user.findUnique({ where: { username: username.trim() } });
        if (existingUser) {
            return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
        }

        // Check limits
        const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
        const userCount = await prisma.user.count({ where: { role: { not: 'ADMIN' } } });

        if (settings && userCount >= settings.maxStaffUsers) {
            return NextResponse.json({ error: `User limit reached (${settings.maxStaffUsers}). Upgrade settings to add more.` }, { status: 400 });
        }

        const newUser = await prisma.user.create({
            data: {
                username: username.trim(),
                password,
                role,
                displayName: displayName?.trim() || username.trim(),
                sessionVersion: 0
            }
        });

        return NextResponse.json(newUser);
    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
