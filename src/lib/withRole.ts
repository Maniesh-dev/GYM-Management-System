import { auth } from './auth'
import { hasPermission, Permission, Role } from '@/types/roles'
import { NextRequest, NextResponse } from 'next/server'

// NextAuth's `auth()` types can vary depending on usage context.
// We only need a minimal "session with user" shape in API route handlers.
type SessionWithUser = {
    user: {
        id: string
        role: Role
        gymId: string
    }
} | null

type Ctx = { session: SessionWithUser }
type Handler = (req: NextRequest, ctx: Ctx) => Promise<Response>

export function withRole(permission: Permission, handler: Handler) {
    return async (req: NextRequest) => {
        const session = (await auth()) as unknown as SessionWithUser

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
        }
        if (!hasPermission(session.user.role, permission)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        return handler(req, { session })
    }
}