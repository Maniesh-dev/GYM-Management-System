import { NextResponse } from 'next/server'
import { withRole } from '@/lib/withRole'
import { prisma } from '@/lib/db'
import { memberSchema } from '@/lib/validations/member.schema'
import { addDays } from 'date-fns'

type MemberStatus = 'ACTIVE' | 'EXPIRED' | 'FROZEN' | 'CANCELLED'

export const GET = withRole('members:read', async (req, { session }) => {
    const search = new URL(req.url).searchParams.get('search') ?? ''
    const status = new URL(req.url).searchParams.get('status') ?? ''

    const members = await prisma.member.findMany({
        where: {
            gymId: session!.user.gymId,
            ...(session!.user.role === 'TRAINER'
                ? { trainerId: session!.user.id } : {}),
            ...(search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search } },
                ],
            } : {}),
            ...(status ? { status: status as MemberStatus } : {}),
        },
        include: {
            plan: { select: { name: true, price: true } },
            trainer: { select: { name: true } },
            _count: { select: { checkins: true, payments: true } },
        },
        orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(members)
})

export const POST = withRole('members:write', async (req, { session }) => {
    const body = await req.json()
    const parsed = memberSchema.safeParse(body)

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const plan = await prisma.plan.findUnique({ where: { id: parsed.data.planId } })
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

    const joinDate = new Date(parsed.data.joinDate)
    const expiryDate = addDays(joinDate, plan.durationDays)

    const member = await prisma.member.create({
        data: {
            ...parsed.data,
            gymId: session!.user.gymId,
            joinDate,
            expiryDate,
            email: parsed.data.email || null,
            trainerId: parsed.data.trainerId || null,
            dob: parsed.data.dob ? new Date(parsed.data.dob) : null,
        },
        include: { plan: true },
    })

    return NextResponse.json(member, { status: 201 })
})