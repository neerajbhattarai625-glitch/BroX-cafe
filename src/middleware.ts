import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // 1. Geo-blocking & VPN Detection
    const country = request.headers.get("x-vercel-ip-country")
    const forwardedFor = request.headers.get("x-forwarded-for")

    // allow /blocked to be viewed
    if (path === "/blocked") return NextResponse.next()

    const isProduction = process.env.NODE_ENV === 'production'
    const isNotNepal = country && country !== 'NP'

    // Potentially detect VPN (e.g. suspicious multiple hops or known non-NP IP in prod)
    // Vercel handles most of this via geo-headers, but we can be stricter.
    if (isProduction) {
        if (isNotNepal || (forwardedFor && forwardedFor.split(',').length > 2)) {
            return NextResponse.redirect(new URL("/blocked", request.url))
        }
    }

    // 2. Dashboard & Counter Auth
    if (path.startsWith("/dashboard") || path.startsWith("/counter")) {
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
