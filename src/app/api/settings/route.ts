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
    } catch (error: any) {
        console.error('Settings fetch error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        return NextResponse.json({
            error: 'Failed to fetch settings',
            details: error.message
        }, { status: 500 });
    }
}
