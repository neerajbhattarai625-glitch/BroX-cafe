import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // 1. Geo-blocking: Nepal Only
    const country = request.headers.get("x-vercel-ip-country")

    // Skip geo-check for public assets if needed, but here we want to block the whole site
    // allow /blocked to be viewed
    if (path === "/blocked") return NextResponse.next()

    // In development, country might be null
    if (process.env.NODE_ENV === 'production' && country && country !== 'NP') {
        return NextResponse.redirect(new URL("/blocked", request.url))
    }

    // 2. Dashboard Auth
    if (path.startsWith("/dashboard")) {
        const token = request.cookies.get("auth_token")?.value

        if (!token) {
            return NextResponse.redirect(new URL("/login", request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
