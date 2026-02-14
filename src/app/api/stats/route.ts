import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");

        if (type === "tables") {
            const tables = await prisma.table.findMany({
                orderBy: { number: 'asc' }
            });
            return NextResponse.json(tables);
        }

        // Existing Stats Logic
        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        const dailySales = await prisma.order.aggregate({
            _sum: { total: true },
            _count: { id: true },
            where: {
                createdAt: { gte: startOfDay, lt: endOfDay },
                status: { not: "CANCELLED" },
                paymentStatus: "PAID"
            }
        })

        const monthlySales = await prisma.order.aggregate({
            _sum: { total: true },
            _count: { id: true },
            where: {
                createdAt: { gte: startOfMonth, lt: endOfMonth },
                status: { not: "CANCELLED" },
                paymentStatus: "PAID"
            }
        })

        return NextResponse.json({
            daily: { total: dailySales._sum.total || 0, count: dailySales._count.id || 0 },
            monthly: { total: monthlySales._sum.total || 0, count: monthlySales._count.id || 0 }
        })

    } catch (error) {
        console.error("Stats Error:", error)
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Create Table
        if (body.number) {
            const table = await prisma.table.create({
                data: {
                    number: body.number,
                    status: 'CLOSED'
                }
            });
            return NextResponse.json(table);
        }
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
