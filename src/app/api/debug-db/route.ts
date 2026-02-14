import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        await prisma.$connect()
        // Try a simple query
        const count = await prisma.order.count()
        return NextResponse.json({ status: "Connected!", orderCount: count })
    } catch (error: any) {
        return NextResponse.json({
            status: "Connection Failed",
            message: error.message,
            code: error.code,
            meta: error.meta
        }, { status: 500 })
    }
}
