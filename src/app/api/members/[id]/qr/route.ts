import { NextResponse } from 'next/server'
import { withRole } from '@/lib/withRole'
import { prisma } from '@/lib/db'
import { generateMemberQR } from '@/lib/qr'

export const GET = withRole('members:read', async (req, { session }) => {
    const id = req.url.split('/members/')[1].split('/')[0]

    const member = await prisma.member.findUnique({
        where: { id, gymId: session!.user.gymId },
        select: { qrToken: true, name: true },
    })

    if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const dataUrl = await generateMemberQR(member.qrToken)
    return NextResponse.json({ dataUrl, name: member.name })
})

export const POST = withRole('members:write', async (req, { session }) => {
    const id = req.url.split('/members/')[1].split('/')[0]

    // Regenerate QR token
    const member = await prisma.member.update({
        where: { id, gymId: session!.user.gymId },
        data: { qrToken: crypto.randomUUID() },
    })

    const dataUrl = await generateMemberQR(member.qrToken)
    return NextResponse.json({ dataUrl })
})