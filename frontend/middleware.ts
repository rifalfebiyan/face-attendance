import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value
    const { pathname } = request.nextUrl

    // Define paths that are public or auth-related
    const isAuthPath = pathname.startsWith('/login') || pathname.startsWith('/register')

    // Define paths that are protected (basically everything else that isn't api or static)
    // We can explicitly check for dashboard paths or protect everything and exclude auth/static

    // For this app, since we moved everything to (dashboard), we can assume root / and other paths are protected.
    // Exception: /api/login and /api/register (though api routes usually handled differently, middleware runs on them too unless excluded)

    // Exclude API routes, static files, images
    if (
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.includes('.') || // file extensions
        pathname.startsWith('/attendance') // Allow public access to attendance kiosk
    ) {
        return NextResponse.next()
    }

    // If user is not authenticated and trying to access protected route
    if (!token && !isAuthPath) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // If user is authenticated and trying to access LOGIN page, redirect to dashboard.
    // We ALLOW accessing /register even if logged in (e.g. admin registering a new employee)
    if (token && pathname.startsWith('/login')) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
