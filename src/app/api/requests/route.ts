import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const requests = await prisma.serviceRequest.findMany({
            orderBy: { createdAt: 'desc' }
        });

        const formattedRequests = requests.map((req: any) => ({
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
