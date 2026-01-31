import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
    try {
        const menuItems = await prisma.menuItem.findMany({
            include: { category: true }
        });
        return NextResponse.json(menuItems);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('image') as File | null;

        let imagePath = '/images/default-food.jpg'; // Default logic if no file or default needed

        if (file && file.size > 0) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            // Create unique filename
            const filename = `${Date.now()}-${file.name.replace(/\s/g, '-')}`;
            const path = join(process.cwd(), 'public/uploads', filename);
            await writeFile(path, buffer);
            imagePath = `/uploads/${filename}`;
        }

        const nameEn = formData.get('nameEn') as string;
        const nameNp = formData.get('nameNp') as string;
        const description = formData.get('description') as string;
        const price = parseFloat(formData.get('price') as string);
        const categoryId = formData.get('categoryId') as string;

        const menuItem = await prisma.menuItem.create({
            data: {
                nameEn,
                nameNp,
                description,
                price,
                categoryId,
                image: imagePath,
            }
        });

        return NextResponse.json(menuItem);
    } catch (error) {
        console.error('Error creating menu item:', error);
        return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 });
    }
}
