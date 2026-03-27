import { NextResponse } from 'next/server'
import { withRole } from '@/lib/withRole'
import { prisma } from '@/lib/db'
import { generateReceiptPDF } from '@/lib/pdf'

export const GET = withRole('billing:read', async (req, { session }) => {
    const id = req.url.split('/payments/')[1].split('/')[0]

    const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
            member: { include: { gym: true } },
            recordedBy: { select: { name: true } },
        },
    })

    if (!payment || payment.member.gymId !== session!.user.gymId) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const count = await prisma.payment.count({
        where: { member: { gymId: session!.user.gymId } },
    })
    const receiptNo = `REC-${String(count).padStart(5, '0')}`

    const plan = await prisma.plan.findUnique({ where: { id: payment.planId } })

    const buf = await generateReceiptPDF({
        receiptNo,
        gymName: payment.member.gym.name,
        gymPhone: payment.member.gym.phone ?? undefined,
        gymAddress: payment.member.gym.address ?? undefined,
        memberName: payment.member.name,
        memberPhone: payment.member.phone,
        planName: plan?.name ?? 'N/A',
        amount: payment.amount,
        mode: payment.mode,
        referenceNo: payment.referenceNo ?? undefined,
        note: payment.note ?? undefined,
        paidAt: payment.paidAt,
        expiryDate: payment.member.expiryDate,
        recordedBy: payment.recordedBy.name,
    })

    return new NextResponse(buf as any, {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${receiptNo}.pdf"`,
        },
    })
})