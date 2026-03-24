import { NextRequest, NextResponse } from 'next/server'
import { withRole } from '@/lib/withRole'
import { prisma } from '@/lib/db'

// POST — Approve a pending staff manual check-in
export const POST = withRole('staff:manage', async (req, { session }) => {
    // extract id from url
    const id = req.url.split('/').slice(-2)[0]

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const checkin = await prisma.trainerCheckin.findFirst({
        where: { id, gymId: session!.user.gymId }
    })

    if (!checkin) {
        return NextResponse.json({ error: 'Check-in not found' }, { status: 404 })
    }

    if ((checkin as any).status === 'APPROVED') {
        return NextResponse.json({ error: 'Already approved' }, { status: 400 })
    }

    const updated = await (prisma.trainerCheckin as any).update({
        where: { id },
        data: { status: 'APPROVED' }
    })

    return NextResponse.json({ success: true, checkin: updated })
})
