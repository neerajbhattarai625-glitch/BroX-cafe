import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await prisma.$connect();
        const tableCount = await prisma.table.count();
        return NextResponse.json({
            status: 'ok',
            database: 'connected',
            tableCount,
            env: process.env.NODE_ENV
        });
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: error.message,
            stack: error.stack,
            code: error.code
        }, { status: 500 });
    }
}
