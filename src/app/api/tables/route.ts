import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const tables = await prisma.table.findMany({
            orderBy: { number: 'asc' }
        });
        return NextResponse.json(tables);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch tables" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { number } = body;

        if (!number) {
            return NextResponse.json({ error: "Table number is required" }, { status: 400 });
        }

        const newTable = await prisma.table.create({
            data: {
                number: String(number),
                status: 'CLOSED'
            }
        });

        return NextResponse.json(newTable);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create table" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, status, number } = body;

        const dataToUpdate: any = {};
        if (status) {
            dataToUpdate.status = status;
            // If closing the table, clear the session and device lock
            if (status === 'CLOSED') {
                dataToUpdate.currentSessionId = null;
                dataToUpdate.deviceId = null;
                dataToUpdate.sessionStartedAt = null;
            }
        }
        if (number) dataToUpdate.number = number;

        const updatedTable = await prisma.table.update({
            where: { id },
            data: dataToUpdate
        });

        return NextResponse.json(updatedTable);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update table' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Table ID is required" }, { status: 400 });
        }

        await prisma.table.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete table" }, { status: 500 });
    }
}
