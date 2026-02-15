import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function GET() {
    try {
        const menuItems = await prisma.menuItem.findMany({
            include: { category: true }
        });
        return NextResponse.json(menuItems, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('image') as File | null;

        let imagePath = '/images/default-food.jpg';
        type CloudinaryUploadResult = { secure_url?: string };

        if (file && file.size > 0) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Upload to Cloudinary using promise wrapper around upload_stream
            const uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: 'cafe-menu' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result ?? {});
                    }
                );
                uploadStream.end(buffer);
            });

            if (uploadResult.secure_url) {
                imagePath = uploadResult.secure_url;
            }
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

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Menu item ID is required' }, { status: 400 });
        }

        await prisma.menuItem.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 });
    }
}
