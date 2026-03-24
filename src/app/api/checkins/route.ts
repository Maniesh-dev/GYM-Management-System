import { NextResponse } from 'next/server'
import { withRole } from '@/lib/withRole'
import { prisma } from '@/lib/db'

export const POST = withRole('checkins:write', async (req, { session }) => {
    const { memberId } = await req.json()

    const member = await prisma.member.findUnique({
        where: { id: memberId, gymId: session!.user.gymId },
    })
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const checkin = await prisma.checkin.create({
        data: { memberId, method: 'MANUAL' },
    })

    return NextResponse.json(checkin, { status: 201 })
})

export const GET = withRole('checkins:read', async (req, { session }) => {
    const gymId = session!.user.gymId
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const checkins = await prisma.checkin.findMany({
        where: { member: { gymId }, checkedAt: { gte: todayStart } },
        include: { member: { select: { name: true, phone: true, plan: { select: { name: true } } } } },
        orderBy: { checkedAt: 'desc' },
    })

    return NextResponse.json(checkins)
})