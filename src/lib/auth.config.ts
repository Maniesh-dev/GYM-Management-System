import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
    // Middleware/auth instance needs the same secret + cookie settings
    // to correctly decode the session token.
    secret: process.env.AUTH_SECRET,
    session: { strategy: 'jwt' },
    trustHost: true,
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === 'production'
                ? '__Secure-next-auth.session-token'
                : 'next-auth.session-token',
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const path = nextUrl.pathname

            const isPublic =
                path === '/login' ||
                path.startsWith('/kiosk') ||
                path.startsWith('/api/auth') ||
                path.startsWith('/api/checkins/scan') ||
                path.startsWith('/api/debug')

            if (isPublic) {
                if (path === '/login' && isLoggedIn) {
                    return Response.redirect(new URL('/dashboard', nextUrl))
                }
                return true
            }

            if (!isLoggedIn) {
                return Response.redirect(new URL('/login', nextUrl))
            }

            return true
        },
    },
    providers: [],
}