import { NextResponse } from 'next/server'
import { withRole } from '@/lib/withRole'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
    status: z.enum(['ACTIVE', 'FROZEN', 'CANCELLED']),
    frozenUntil: z.string().optional(),
})

export const PATCH = withRole('members:write', async (req, { session }) => {
    const id = req.url.split('/members/')[1].split('/')[0]
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const member = await prisma.member.update({
        where: { id, gymId: session!.user.gymId },
        data: {
            status: parsed.data.status,
            frozenUntil: parsed.data.frozenUntil
                ? new Date(parsed.data.frozenUntil)
                : null,
        },
    })

    return NextResponse.json(member)
})