import { NextResponse } from 'next/server'
import { withRole } from '@/lib/withRole'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const planSchema = z.object({
    name: z.string().min(1),
    durationDays: z.coerce.number().int().positive(),
    price: z.coerce.number().positive(),
    isActive: z.boolean().optional(),
})

export const PUT = withRole('settings:manage', async (req, { session }) => {
    const id = req.url.split('/plans/')[1].split('/')[0]
    const body = await req.json()
    const parsed = planSchema.safeParse(body)

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const plan = await prisma.plan.update({
        where: { id, gymId: session!.user.gymId },
        data: parsed.data,
    })

    return NextResponse.json(plan)
})

export const DELETE = withRole('settings:manage', async (req, { session }) => {
    const id = req.url.split('/plans/')[1].split('/')[0]

    await prisma.plan.update({
        where: { id, gymId: session!.user.gymId },
        data: { isActive: false },
    })

    return NextResponse.json({ success: true })
})