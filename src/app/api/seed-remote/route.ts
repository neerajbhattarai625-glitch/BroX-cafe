import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        // Clear existing data to prevent duplicates
        await prisma.menuItem.deleteMany({})
        await prisma.category.deleteMany({})

        // Categories
        const catMomo = await prisma.category.create({
            data: { nameEn: 'Momo', nameNp: 'मोमो' }
        })
        const catNoodles = await prisma.category.create({
            data: { nameEn: 'Noodles', nameNp: 'चाउमिन/थुक्पा' }
        })
        const catDrinks = await prisma.category.create({
            data: { nameEn: 'Drinks', nameNp: 'पेय पदार्थ' }
        })

        // Items
        await prisma.menuItem.create({
            data: {
                nameEn: 'Steam Buff Momo',
                nameNp: 'बफ मोमो (स्टिम)',
                description: 'Juicy buff mince filled dumplings, served with spicy achar.',
                price: 150,
                categoryId: catMomo.id,
                image: 'https://images.unsplash.com/photo-1626804475297-411dbcc8c4fb?w=800&q=80',
            }
        })

        await prisma.menuItem.create({
            data: {
                nameEn: 'Veg Momo',
                nameNp: 'भेज मोमो',
                description: 'Fresh vegetable filling with special herbs.',
                price: 120,
                categoryId: catMomo.id,
                image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80',
            }
        })

        await prisma.menuItem.create({
            data: {
                nameEn: 'Chicken Thukpa',
                nameNp: 'चिकेन थुक्पा',
                description: 'Hot noodle soup with chicken and veggies.',
                price: 180,
                categoryId: catNoodles.id,
                image: 'https://images.unsplash.com/photo-1625167359766-1514a586b614?w=800&q=80',
            }
        })

        await prisma.menuItem.create({
            data: {
                nameEn: 'Masala Tea',
                nameNp: 'मसला चिया',
                description: 'Authentic Nepali masala tea.',
                price: 50,
                categoryId: catDrinks.id,
                image: 'https://images.unsplash.com/photo-1616164295171-881b8577f893?w=800&q=80',
            }
        })

        return NextResponse.json({ success: true, message: "Database Seeded Successfully!" })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
