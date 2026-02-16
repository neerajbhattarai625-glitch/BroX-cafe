import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        let settings = await prisma.siteSettings.findUnique({
            where: { id: 'global' }
        });

        // Initialize default settings if not exists
        if (!settings) {
            settings = await prisma.siteSettings.create({
                data: { id: 'global' }
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        const err = error as Error;
        console.error('Settings fetch error details:', {
            message: err.message,
            stack: err.stack,
            code: (err as { code?: string }).code
        });
        return NextResponse.json({
            error: 'Failed to fetch settings',
            details: err.message
        }, { status: 500 });
    }
}
