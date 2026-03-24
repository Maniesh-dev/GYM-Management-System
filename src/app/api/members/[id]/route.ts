import { NextResponse } from 'next/server'
import { withRole } from '@/lib/withRole'
import { prisma } from '@/lib/db'
import { memberSchema } from '@/lib/validations/member.schema'
import { addDays } from 'date-fns'

export const GET = withRole('members:read', async (req, { session }) => {
    const id = req.url.split('/members/')[1].split('/')[0]

    const member = await prisma.member.findUnique({
        where: { id, gymId: session!.user.gymId },
        include: {
            plan: true,
            trainer: { select: { name: true, email: true } },
            payments: { orderBy: { paidAt: 'desc' }, take: 10 },
            checkins: { orderBy: { checkedAt: 'desc' }, take: 20 },
        },
    })

    if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(member)
})

export const PUT = withRole('members:write', async (req, { session }) => {
    const id = req.url.split('/members/')[1].split('/')[0]
    const body = await req.json()
    const parsed = memberSchema.safeParse(body)

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const member = await prisma.member.update({
        where: { id, gymId: session!.user.gymId },
        data: {
            ...parsed.data,
            email: parsed.data.email || null,
            trainerId: parsed.data.trainerId || null,
            dob: parsed.data.dob ? new Date(parsed.data.dob) : null,
        },
    })

    return NextResponse.json(member)
})

export const DELETE = withRole('members:delete', async (req, { session }) => {
    const id = req.url.split('/members/')[1].split('/')[0]

    await prisma.member.update({
        where: { id, gymId: session!.user.gymId },
        data: { status: 'CANCELLED' },
    })

    return NextResponse.json({ success: true })
})