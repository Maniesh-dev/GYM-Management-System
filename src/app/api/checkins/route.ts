import { NextResponse } from 'next/server'
import { withRole } from '@/lib/withRole'
import { prisma } from '@/lib/db'
import { getISTStartOfDay } from '@/lib/utils'

export const POST = withRole('checkins:write', async (req, { session }) => {
    const { memberId } = await req.json()

    const member = await prisma.member.findUnique({
        where: { id: memberId, gymId: session!.user.gymId },
    })
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const todayStart = getISTStartOfDay()
    const existingCheckin = await prisma.checkin.findFirst({
        where: {
            memberId,
            checkedAt: { gte: todayStart },
        },
    })

    if (existingCheckin) {
        return NextResponse.json(
            {
                error: 'Already checked in today',
                message: `Checked in at ${new Date(existingCheckin.checkedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}. Entry restricted to once per day.`,
            },
            { status: 409 }
        )
    }

    const checkin = await prisma.checkin.create({
        data: { memberId, method: 'MANUAL' },
    })

    return NextResponse.json(checkin, { status: 201 })
})

export const GET = withRole('checkins:read', async (req, { session }) => {
    const gymId = session!.user.gymId
    const todayStart = getISTStartOfDay()

    const checkins = await prisma.checkin.findMany({
        where: { member: { gymId }, checkedAt: { gte: todayStart } },
        include: { member: { select: { name: true, phone: true, plan: { select: { name: true } } } } },
        orderBy: { checkedAt: 'desc' },
    })

    return NextResponse.json(checkins)
})