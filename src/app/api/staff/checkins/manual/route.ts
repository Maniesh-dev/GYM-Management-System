import { NextRequest, NextResponse } from 'next/server'
import { withRole } from '@/lib/withRole'
import { prisma } from '@/lib/db'

// GET — search staff by name or phone
export const GET = withRole('checkins:write', async (req, { session }) => {
    const q = new URL(req.url).searchParams.get('q')?.trim()

    if (!q) {
        return NextResponse.json(
            { error: 'Search query is required' },
            { status: 400 }
        )
    }

    const staff = await prisma.user.findMany({
        where: {
            gymId: session!.user.gymId,
            OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q } },
            ],
        },
        include: {
            trainerCheckins: {
                orderBy: { checkedAt: 'desc' },
                take: 1,
            },
        },
        take: 5,
    })

    return NextResponse.json(staff.map(s => {
        const last = s.trainerCheckins[0]
        const alreadyIn = last?.type === 'IN' && 
            new Date(last.checkedAt).getTime() > Date.now() - 12 * 60 * 60 * 1000 // 12h threshold for staff

        return {
            id: s.id,
            name: s.name,
            phone: s.phone,
            role: s.role,
            alreadyIn,
            lastType: last?.type ?? 'OUT',
            lastCheckin: last?.checkedAt ?? null,
        }
    }))
})

// POST — confirm staff manual check-in/out
export const POST = withRole('checkins:write', async (req, { session }) => {
    const { userId, type } = await req.json() // type: 'IN' or 'OUT'

    if (!userId || !type) {
        return NextResponse.json(
            { error: 'userId and type are required' },
            { status: 400 }
        )
    }

    const targetUser = await prisma.user.findUnique({
        where: { id: userId, gymId: session!.user.gymId },
    })

    if (!targetUser) {
        return NextResponse.json(
            { error: 'Staff member not found' },
            { status: 404 }
        )
    }

    // Role-based approval logic
    let status = 'APPROVED'
    if (session!.user.id === userId && session!.user.role === 'RECEPTION') {
        status = 'PENDING'
    }

    const checkin = await (prisma.trainerCheckin as any).create({
        data: {
            userId,
            gymId: session!.user.gymId,
            type,
            method: 'MANUAL',
            status,
        },
    })

    return NextResponse.json({ 
        success: true, 
        checkin,
        needsApproval: status === 'PENDING' 
    }, { status: 201 })
})
