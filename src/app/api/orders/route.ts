import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
        const { tableNo, items, total } = body;

        const newOrder = await prisma.order.create({
            data: {
                tableNo,
                items: JSON.stringify(items), // Store as JSON string
                total,
                status: 'PENDING'
            }
        });

        return NextResponse.json({
            ...newOrder,
            items: JSON.parse(newOrder.items),
            time: newOrder.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, status } = body;

        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { status }
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
