import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // Parse items JSON string back to object
        const formattedOrders = orders.map((order: any) => ({
            ...order,
            items: JSON.parse(order.items),
            time: order.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));

        return NextResponse.json(formattedOrders);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { tableNo, items, total, paymentMethod, deviceName, location, isOnlineOrder } = body;

        let sessionId = null;

        // 1. Session Validation (Only for Table Orders)
        if (!isOnlineOrder) {
            const cookieStore = await cookies();
            const sessionCookie = cookieStore.get("table_session");

            if (!sessionCookie) {
                return NextResponse.json({ error: "No active session" }, { status: 401 });
            }

            let session;
            try {
                session = JSON.parse(sessionCookie.value);
            } catch (e) {
                return NextResponse.json({ error: "Invalid session" }, { status: 401 });
            }

            // Validate against DB
            const table = await prisma.table.findUnique({
                where: { id: session.tableId }
            });

            if (!table || table.status !== 'OPEN' || table.currentSessionId !== session.sessionId) {
                return NextResponse.json({ error: "Session expired or invalid" }, { status: 403 });
            }

            // Validate device ID matches
            if (table.deviceId && table.deviceId !== session.deviceId) {
                return NextResponse.json({ error: "Device mismatch - session hijacking detected" }, { status: 403 });
            }

            sessionId = session.sessionId;
        }

        // 2. Mandatory Validation for Online Orders
        if (isOnlineOrder && (!location || !deviceName)) {
            return NextResponse.json({ error: "Location and Device Info are mandatory for online orders" }, { status: 400 });
        }

        // 3. Create order
        const newOrder = await prisma.order.create({
            data: {
                tableNo: tableNo || "ONLINE",
                sessionId,
                items: JSON.stringify(items),
                total,
                status: 'PENDING',
                paymentMethod: paymentMethod || 'CASH',
                paymentStatus: 'PENDING',
                deviceName,
                location,
                isOnlineOrder: !!isOnlineOrder
            }
        });

        return NextResponse.json({
            ...newOrder,
            items: JSON.parse(newOrder.items),
            time: newOrder.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    } catch (error) {
        console.error("ORDER ERROR:", error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, status, paymentStatus } = body;

        const dataToUpdate: any = {};
        if (status) dataToUpdate.status = status;
        if (paymentStatus) dataToUpdate.paymentStatus = paymentStatus;

        const updatedOrder = await prisma.order.update({
            where: { id },
            data: dataToUpdate
        });

        return NextResponse.json({
            ...updatedOrder,
            items: JSON.parse(updatedOrder.items),
            time: updatedOrder.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}
