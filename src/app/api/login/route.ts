import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
    const body = await request.json()
    const { username, password } = body

    // In a real app, use environment variables. 
    // For this prototype, checking against hardcoded/mocked envs for simplicity as requested,
    // but ideally reading from process.env is better.
    const validUsername = process.env.ADMIN_USERNAME || "admin"
    const validPassword = process.env.ADMIN_PASSWORD || "cafe123"

    if (username === validUsername && password === validPassword) {
        // Set a cookie
        const response = NextResponse.json({ success: true })
        response.cookies.set("auth_token", "valid_token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        })
        return response
    }

    return NextResponse.json({ success: false }, { status: 401 })
}
