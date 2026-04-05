import { NextResponse } from 'next/server'
import { withRole } from '@/lib/withRole'
import { prisma } from '@/lib/db'
import { generateTrainerQR } from '@/lib/qr'

export const POST = withRole('staff:manage', async (req, { session }) => {
    const id = req.url.split('/staff/')[1].split('/')[0]

    // Regenerate QR token
    const staff = await prisma.user.update({
        where: { id, gymId: session!.user.gymId },
        data: { qrToken: crypto.randomUUID() },
    })

    const dataUrl = await generateTrainerQR(staff.qrToken)
    return NextResponse.json({ dataUrl })
})
