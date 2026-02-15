import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const requests = await prisma.serviceRequest.findMany({
            orderBy: { createdAt: 'desc' }
        });

        const formattedRequests = requests.map((req) => ({
            ...req,
            time: req.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));

        return NextResponse.json(formattedRequests);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { tableNo, type } = body;
        console.log(`[API] Service Request: Table ${tableNo}, Type ${type}`);

        const newReq = await prisma.serviceRequest.create({
            data: {
                tableNo,
                type,
                status: 'PENDING'
            }
        });

        return NextResponse.json({
            ...newReq,
            time: newReq.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();

        // Handle Table Status Update
        if (body.tableId && body.status) {
            const { tableId, status } = body;
            // If opening, generate new session ID
            const updateData: { status: string; currentSessionId?: string } = { status };
            if (status === 'OPEN') {
                updateData.currentSessionId = crypto.randomUUID();
            }

            const updatedTable = await prisma.table.update({
                where: { id: tableId },
                data: updateData
            });

            return NextResponse.json(updatedTable);
        }

        // Handle Request Status Update (optional, existing logic fallback)
        if (body.id && body.status) {
            const updatedReq = await prisma.serviceRequest.update({
                where: { id: body.id },
                data: { status: body.status }
            });
            return NextResponse.json(updatedReq);
        }

        return NextResponse.json({ error: "Invalid" }, { status: 400 });
    } catch (e) {
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
