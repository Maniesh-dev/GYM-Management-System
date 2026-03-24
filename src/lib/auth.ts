import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './db'
import { authConfig } from './auth.config'

type UserRole = 'OWNER' | 'RECEPTION' | 'TRAINER'

declare module 'next-auth' {
    interface User {
        id: string
        role: UserRole
        gymId: string
    }
}

declare module '@auth/core/jwt' {
    interface JWT {
        id: string
        role: UserRole
        gymId: string
    }
}

export const {
    handlers,
    auth,
    signIn,
    signOut,
} = NextAuth({
    ...authConfig,

    secret: process.env.AUTH_SECRET,

    providers: [
        Credentials({
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    console.log('[authorize] missing credentials')
                    return null
                }

                const email = String(credentials.email).trim().toLowerCase()
                const password = String(credentials.password)

                console.log('[authorize] looking up user:', email)

                try {
                    const user = await prisma.user.findUnique({ where: { email } })

                    if (!user) {
                        console.log('[authorize] user not found:', email)
                        return null
                    }

                    console.log('[authorize] user found, checking password...')

                    const valid = await bcrypt.compare(password, user.passwordHash)

                    if (!valid) {
                        console.log('[authorize] password mismatch')
                        return null
                    }

                    console.log('[authorize] success for:', email)

                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        gymId: user.gymId,
                    }
                } catch (err) {
                    console.error('[authorize] DB error:', err)
                    return null
                }
            },
        }),
    ],

    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.gymId = user.gymId
            }
            return token
        },
        session({ session, token }) {
            session.user.id = token.id as string
            session.user.role = token.role as UserRole
            session.user.gymId = token.gymId as string
            return session
        },
    },

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
})