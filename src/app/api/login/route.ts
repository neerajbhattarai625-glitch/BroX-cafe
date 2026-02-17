import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("table_session");

    if (sessionCookie) {
        try {
            const session = JSON.parse(sessionCookie.value);
            const table = await prisma.table.findUnique({
                where: { id: session.tableId }
            });

            // If table is closed or sessionId changed, session is invalid
            if (!table || table.status !== 'OPEN' || table.currentSessionId !== session.sessionId) {
                return NextResponse.json({ success: false, error: "Session expired or table closed" });
            }

            return NextResponse.json({ success: true, session, table });
        } catch (e) {
            return NextResponse.json({ success: false, error: "Invalid session" });
        }
    }

    return NextResponse.json({ success: false, error: "No session found" });
}

export async function POST(request: Request) {
    const body = await request.json();

    // 1. Table Login (QR Code Scan)
    if (body.tableId) {
        const { tableId, deviceId } = body;

        if (!deviceId) {
            return NextResponse.json({ error: "Device ID required" }, { status: 400 });
        }

        const table = await prisma.table.findUnique({
            where: { id: tableId }
        });

        if (!table) {
            return NextResponse.json({ error: "Table not found" }, { status: 404 });
        }

        // 1. Check if CURRENT table is locked to a DIFFERENT device
        if (table.status === 'OPEN' && table.deviceId && table.deviceId !== deviceId) {
            return NextResponse.json({
                error: "Table is currently in use by another device",
                code: "TABLE_IN_USE"
            }, { status: 403 });
        }

        // 2. Check if THIS device is already at a DIFFERENT table
        const existingTable = await prisma.table.findFirst({
            where: {
                deviceId: deviceId,
                status: 'OPEN',
                id: { not: tableId }
            }
        });

        if (existingTable) {
            return NextResponse.json({
                error: `You already have an active session at Table ${existingTable.number}. Please finish that session first.`,
                code: "DEVICE_ALREADY_IN_SESSION",
                existingTableId: existingTable.id,
                existingTableNumber: existingTable.number
            }, { status: 403 });
        }

        let sessionId = table.currentSessionId;

        // Auto-open table if closed
        if (table.status === 'CLOSED') {
            sessionId = crypto.randomUUID();
            await prisma.table.update({
                where: { id: tableId },
                data: {
                    status: 'OPEN',
                    currentSessionId: sessionId,
                    deviceId: deviceId,
                    sessionStartedAt: new Date()
                }
            });
        } else if (table.status === 'OPEN' && table.deviceId === deviceId) {
            // Same device re-accessing - allow and refresh session
            if (!sessionId) {
                sessionId = crypto.randomUUID();
                await prisma.table.update({
                    where: { id: tableId },
                    data: {
                        currentSessionId: sessionId,
                        sessionStartedAt: new Date()
                    }
                });
            }
        }


        const sessionData = {
            tableId: table.id,
            sessionId: sessionId,
            deviceId: deviceId,
            createdAt: Date.now()
        };

        // Fetch updated table to return correct status
        const updatedTable = await prisma.table.findUnique({
            where: { id: tableId }
        });

        const response = NextResponse.json({
            success: true,
            table: updatedTable || { ...table, currentSessionId: sessionId, status: 'OPEN' }
        });
        response.cookies.set("table_session", JSON.stringify(sessionData), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 6 // 6 hours
        });
        return response;
    }

    // 2. User Login
    const { username, password } = body;

    // DB-Only Verification (No Hardcoded Fallbacks)
    const user = await prisma.user.findUnique({ where: { username } });
    if (user) {
        if (user.password === password) {
            const response = NextResponse.json({
                success: true,
                role: user.role,
                user: {
                    id: user.id,
                    username: user.username,
                    displayName: user.displayName || user.username,
                    role: user.role,
                    sessionVersion: user.sessionVersion
                }
            });

            // Token format: userId:sessionVersion (Simple but effective for this scale)
            const token = `${user.id}:${user.sessionVersion}`;

            response.cookies.set("auth_token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                path: "/",
                maxAge: 60 * 60 * 24 * 7 // 7 days for staff
            });
            return response;
        } else {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}
