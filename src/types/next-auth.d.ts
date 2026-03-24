import { DefaultSession } from 'next-auth'
import { Role } from './roles'

declare module 'next-auth' {
    interface Session {
        user: {
            id: string
            role: Role
            gymId: string
        } & DefaultSession['user']
    }
}