import { NextResponse } from "next/server"

export async function POST() {
    const response = NextResponse.json({ success: true })

    // Explicitly clear by setting expiry to past
    response.cookies.set("auth_token", "", { path: "/", expires: new Date(0) })
    response.cookies.set("table_session", "", { path: "/", expires: new Date(0) })

    return response
}
