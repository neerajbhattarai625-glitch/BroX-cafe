import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const authCookie = cookieStore.get("auth_token");

        if (!authCookie) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        // Get current user
        let username = null;
        let currentStoredPassword = null;

        // Check hardcoded users first
        if (authCookie.value === "admin_token") {
            username = "admin";
            currentStoredPassword = "admin123";
        } else if (authCookie.value === "staff_token") {
            username = "staff";
            currentStoredPassword = "staff123";
        } else if (authCookie.value === "chef_token") {
            username = "chef";
            currentStoredPassword = "chef123";
        } else if (authCookie.value === "counter_token") {
            username = "counter";
            currentStoredPassword = "counter123";
        } else {
            // DB user
            const user = await prisma.user.findUnique({
                where: { id: authCookie.value }
            });
            if (!user) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
            username = user.username;
            currentStoredPassword = user.password;
        }

        // Verify current password
        if (currentPassword !== currentStoredPassword) {
            return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
        }

        // For hardcoded users, we can't change password (they're in code)
        // We need to create them in DB first
        if (["admin_token", "staff_token", "chef_token", "counter_token"].includes(authCookie.value)) {
            // Create user in DB if doesn't exist
            const role = authCookie.value === "admin_token" ? "ADMIN" :
                authCookie.value === "counter_token" ? "COUNTER" : "STAFF";

            const existingUser = await prisma.user.findUnique({ where: { username } });

            if (existingUser) {
                // Update password
                await prisma.user.update({
                    where: { username },
                    data: { password: newPassword }
                });
            } else {
                // Create new user
                const newUser = await prisma.user.create({
                    data: {
                        username,
                        password: newPassword,
                        role
                    }
                });
                // Update auth token to use DB user ID
                const response = NextResponse.json({ success: true, message: 'Password changed successfully' });
                response.cookies.set("auth_token", newUser.id, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    path: "/"
                });
                return response;
            }
        } else {
            // Update DB user password
            await prisma.user.update({
                where: { id: authCookie.value },
                data: { password: newPassword }
            });
        }

        return NextResponse.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
    }
}
