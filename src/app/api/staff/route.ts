import { NextResponse } from 'next/server'
import { withRole } from '@/lib/withRole'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const staffSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6, 'Minimum 6 characters'),
    role: z.enum(['TRAINER', 'RECEPTION']),
    phone: z.string().optional(),
})

type StaffRole = 'TRAINER' | 'RECEPTION'

export const GET = withRole('staff:manage', async (req, { session }) => {
    const role = new URL(req.url).searchParams.get('role')

    const staff = await prisma.user.findMany({
        where: {
            gymId: session!.user.gymId,
            role: role ? (role as StaffRole) : { in: ['TRAINER', 'RECEPTION'] },
        },
        select: {
            id: true, name: true, email: true, role: true,
            phone: true, qrToken: true, createdAt: true,
            assignedMembers: { select: { id: true } },
            trainerCheckins: {
                where: { checkedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
                orderBy: { checkedAt: 'desc' },
                take: 1,
            },
        },
        orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(staff)
})

export const POST = withRole('staff:manage', async (req, { session }) => {
    const body = await req.json()
    const parsed = staffSchema.safeParse(body)

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } })
    if (exists) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })

    const user = await prisma.user.create({
        data: {
            name: parsed.data.name,
            email: parsed.data.email,
            passwordHash: await bcrypt.hash(parsed.data.password, 10),
            role: parsed.data.role,
            phone: parsed.data.phone || null,
            gymId: session!.user.gymId,
        },
    })

    return NextResponse.json(user, { status: 201 })
})