import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: { menuItems: true }
                }
            },
            orderBy: { nameEn: 'asc' }
        });
        return NextResponse.json(categories);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const authCookie = cookieStore.get("auth_token");
        if (!authCookie || (authCookie.value !== "admin_token" && !(await isAdmin(authCookie.value)))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { nameEn, nameNp } = body;

        if (!nameEn || !nameNp) {
            return NextResponse.json({ error: 'Missing names' }, { status: 400 });
        }

        const category = await prisma.category.create({
            data: { nameEn, nameNp }
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("Create category error:", error);
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const cookieStore = await cookies();
        const authCookie = cookieStore.get("auth_token");
        if (!authCookie || (authCookie.value !== "admin_token" && !(await isAdmin(authCookie.value)))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        // Check if items exist
        const itemsCount = await prisma.menuItem.count({ where: { categoryId: id } });
        if (itemsCount > 0) {
            return NextResponse.json({ error: 'Cannot delete category with menu items' }, { status: 400 });
        }

        await prisma.category.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }
}

async function isAdmin(token: string) {
    const user = await prisma.user.findUnique({ where: { id: token } });
    return user?.role === 'ADMIN';
}
