import { NextRequest, NextResponse } from 'next/server'
import { withRole } from '@/lib/withRole'
import { prisma } from '@/lib/db'
import { getISTStartOfDay } from '@/lib/utils'

// GET — search member by phone number
export const GET = withRole('checkins:write', async (req, { session }) => {
    const phone = new URL(req.url).searchParams.get('phone')?.trim()

    if (!phone) {
        return NextResponse.json(
            { error: 'Phone number is required' },
            { status: 400 }
        )
    }

    const member = await prisma.member.findFirst({
        where: {
            gymId: session!.user.gymId,
            phone: { contains: phone },
        },
        include: {
            plan: true,
            trainer: { select: { name: true } },
            checkins: {
                orderBy: { checkedAt: 'desc' },
                take: 1,
            },
        },
    })

    if (!member) {
        return NextResponse.json(
            { error: 'No member found with this phone number' },
            { status: 404 }
        )
    }

    // Check if already checked in today (IST)
    const todayStart = getISTStartOfDay()
    const todayCheckin = member.checkins[0]
        ? new Date(member.checkins[0].checkedAt).getTime() >= todayStart.getTime()
        : false

    const daysLeft = Math.ceil(
        (new Date(member.expiryDate).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    )

    return NextResponse.json({
        id: member.id,
        name: member.name,
        phone: member.phone,
        photoUrl: member.photoUrl,
        status: member.status,
        planName: member.plan.name,
        expiryDate: member.expiryDate,
        daysLeft: Math.max(0, daysLeft),
        trainerName: member.trainer?.name ?? null,
        alreadyIn: todayCheckin,
        lastCheckin: member.checkins[0]?.checkedAt ?? null,
    })
})

// POST — confirm manual check-in
export const POST = withRole('checkins:write', async (req, { session }) => {
    const { memberId } = await req.json()

    if (!memberId) {
        return NextResponse.json(
            { error: 'memberId is required' },
            { status: 400 }
        )
    }

    const member = await prisma.member.findUnique({
        where: { id: memberId, gymId: session!.user.gymId },
    })

    if (!member) {
        return NextResponse.json(
            { error: 'Member not found' },
            { status: 404 }
        )
    }

    const checkin = await prisma.checkin.create({
        data: { memberId, method: 'MANUAL' },
    })

    return NextResponse.json({ success: true, checkin }, { status: 201 })
})