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

        // Check hardcoded users first
        if (authCookie.value === "admin_token") {
            return NextResponse.json({ username: "admin", role: "ADMIN", displayName: "Admin" });
        } else if (authCookie.value === "staff_token") {
            return NextResponse.json({ username: "staff", role: "STAFF", displayName: "Staff" });
        } else if (authCookie.value === "chef_token") {
            return NextResponse.json({ username: "chef", role: "CHEF", displayName: "Chef" });
        } else if (authCookie.value === "counter_token") {
            return NextResponse.json({ username: "counter", role: "COUNTER", displayName: "Counter" });
        }

        // DB user
        const user = await prisma.user.findUnique({
            where: { id: authCookie.value },
            select: {
                id: true,
                username: true,
                role: true,
                displayName: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            ...user,
            displayName: user.displayName || user.username
        });
    } catch (error) {
        console.error('Fetch me error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
