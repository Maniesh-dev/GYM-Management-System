'use client'
import { useSession } from 'next-auth/react'
import { hasPermission, Permission, Role } from '@/types/roles'

export function useRole() {
    const { data: session } = useSession()
    const role = session?.user?.role as Role | undefined

    return {
        role,
        gymId: session?.user?.gymId,
        userId: session?.user?.id,
        can: (p: Permission) => (role ? hasPermission(role, p) : false),
    }
}