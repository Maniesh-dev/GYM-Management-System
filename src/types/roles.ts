export type Role = 'OWNER' | 'TRAINER' | 'RECEPTION'

export type Permission =
    | 'members:read' | 'members:write' | 'members:delete'
    | 'billing:read' | 'billing:write'
    | 'checkins:read' | 'checkins:write'
    | 'reports:read' | 'staff:manage' | 'settings:manage'
    | 'trainer:own_members'

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    OWNER: [
        'members:read', 'members:write', 'members:delete',
        'billing:read', 'billing:write',
        'checkins:read', 'checkins:write',
        'reports:read', 'staff:manage', 'settings:manage',
        'trainer:own_members',
    ],
    RECEPTION: [
        'members:read', 'members:write',
        'billing:read', 'billing:write',
        'checkins:read', 'checkins:write',
    ],
    TRAINER: [
        'members:read',
        'checkins:read',
        'trainer:own_members',
    ],
}

export function hasPermission(role: Role, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role].includes(permission)
}