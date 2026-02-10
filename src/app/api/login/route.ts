import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    const cookieStore = await cookies();
    // ...
}

export async function POST(request: Request) {
    const body = await request.json();
    console.log("[LOGIN API] Received body:", body);

    // 1. Table Login (QR Code Scan)
    if (body.tableId) {
        console.log("[LOGIN API] Processing Table Login for:", body.tableId);
        const { tableId } = body;

        // A. Device Lock Check
        const cookieStore = await cookies();
        const existingSession = cookieStore.get("table_session");

        if (existingSession) {
            try {
                const session = JSON.parse(existingSession.value);
                // If user is already active at ANOTHER table, block them.
                if (session.tableId !== tableId) {
                    return NextResponse.json({
                        error: "Active Session Detected",
                        message: "You are already seated at another table. Please checkout first."
                    }, { status: 400 });
                }
            } catch (e) {
                // Invalid cookie, ignore
            }
        }

        const table = await prisma.table.findUnique({
            where: { id: tableId }
        });

        if (!table) {
            return NextResponse.json({ error: "Table not found" }, { status: 404 });
        }

        let sessionId = table.currentSessionId;

        // B. Smart Auto-Open Logic
        if (table.status === 'CLOSED') {
            sessionId = crypto.randomUUID();
            await prisma.table.update({
                where: { id: tableId },
                data: {
                    status: 'OPEN',
                    currentSessionId: sessionId
                }
            });
        }

        // If table is somehow OPEN but has no session ID (legacy/error case), fix it
        if (table.status === 'OPEN' && !sessionId) {
            sessionId = crypto.randomUUID();
            await prisma.table.update({
                where: { id: tableId },
                data: { currentSessionId: sessionId }
            });
        }

        const sessionData = {
            tableId: table.id,
            sessionId: sessionId,
            createdAt: Date.now()
        };

        const response = NextResponse.json({ success: true, table });
        response.cookies.set("table_session", JSON.stringify(sessionData), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 4 // 4 hours
        });
        return response;
    }

    // 2. User Login
    const { username, password } = body;

    // Hardcoded fallbacks for immediate testing without seeding
    if (username === "admin" && password === "admin123") {
        const response = NextResponse.json({ success: true, role: "ADMIN" });
        response.cookies.set("auth_token", "admin_token", { httpOnly: true, path: "/" });
        return response;
    }
    if (username === "staff" && password === "staff123") {
        const response = NextResponse.json({ success: true, role: "STAFF" });
        response.cookies.set("auth_token", "staff_token", { httpOnly: true, path: "/" });
        return response;
    }
    if (username === "counter" && password === "counter123") {
        const response = NextResponse.json({ success: true, role: "COUNTER" });
        response.cookies.set("auth_token", "counter_token", { httpOnly: true, path: "/" });
        return response;
    }

    // DB Check
    const user = await prisma.user.findUnique({ where: { username } });
    if (user && user.password === password) {
        const response = NextResponse.json({ success: true, role: user.role });
        response.cookies.set("auth_token", user.id, { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/" });
        return response;
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}
