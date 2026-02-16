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

        // Handle Table Status Update
        // This block seems to be misplaced in a GET request and expects a 'body' variable.
        // It should likely be in a POST or PUT request.
        // For now, it's commented out as it would cause an error due to 'body' not being defined.
        /*
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
        */

        // If no specific update logic is triggered (which it shouldn't be in a GET),
        // return the formatted requests.
        return NextResponse.json(formattedRequests);
    } catch (e) {
        console.error("Error in GET /api/service-requests:", e);
        return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
    }
}

// Helper function for calculating distance (assuming it's defined elsewhere or will be added)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { tableNo, type, userLat, userLng, audioData } = body;
        console.log(`[API] Service Request: Table ${tableNo}, Type ${type}, Audio: ${audioData ? 'Yes' : 'No'}`);

        const assignedToUserId = null;

        // Smart Waiter Logic Removed as per user request (Broadcast mode)
        // Request will be unassigned and visible to all staff until picked up.

        const newReq = await prisma.serviceRequest.create({
            data: {
                tableNo,
                type,
                status: 'PENDING',
                userLat,
                userLng,
                assignedToUserId,
                audioData // Save audio data
            }
        });

        return NextResponse.json({
            ...newReq,
            time: newReq.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
        }

        const updatedRequest = await prisma.serviceRequest.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json({
            ...updatedRequest,
            time: updatedRequest.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    } catch (error) {
        console.error('PATCH /api/requests error:', error);
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
    }
}
