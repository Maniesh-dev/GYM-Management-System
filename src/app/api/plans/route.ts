import { NextResponse } from 'next/server'
import { withRole } from '@/lib/withRole'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const planSchema = z.object({
    name: z.string().min(1),
    durationDays: z.coerce.number().int().positive(),
    price: z.coerce.number().positive(),
})

export const GET = withRole('members:read', async (_req, { session }) => {
    const plans = await prisma.plan.findMany({
        where: { gymId: session!.user.gymId, isActive: true },
        orderBy: { price: 'asc' },
    })
    return NextResponse.json(plans)
})

export const POST = withRole('settings:manage', async (req, { session }) => {
    const body = await req.json()
    const parsed = planSchema.safeParse(body)

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const plan = await prisma.plan.create({
        data: { ...parsed.data, gymId: session!.user.gymId },
    })

    return NextResponse.json(plan, { status: 201 })
})
