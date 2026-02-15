import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        await prisma.$connect()
        // Try a simple query
        const count = await prisma.order.count()
        return NextResponse.json({ status: "Connected!", orderCount: count })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error"
        const code = typeof (error as { code?: unknown }).code === "string" ? (error as { code: string }).code : undefined
        const meta = (error as { meta?: unknown }).meta
        return NextResponse.json({
            status: "Connection Failed",
            message,
            code,
            meta
        }, { status: 500 })
    }
}
