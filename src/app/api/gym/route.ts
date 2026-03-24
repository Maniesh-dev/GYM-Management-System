import { NextResponse } from 'next/server'
import { withRole } from '@/lib/withRole'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const gymSchema = z.object({
    name: z.string().min(2),
    phone: z.string().optional(),
    address: z.string().optional(),
})

export const PUT = withRole('settings:manage', async (req, { session }) => {
    const body = await req.json()
    const parsed = gymSchema.safeParse(body)

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const gym = await prisma.gym.update({
        where: { id: session!.user.gymId },
        data: parsed.data,
    })

    return NextResponse.json(gym)
})