import { NextResponse } from 'next/server'
import { withRole } from '@/lib/withRole'
import { prisma } from '@/lib/db'
import { paymentSchema } from '@/lib/validations/payment.schema'
import { sendReceiptWhatsApp } from '@/lib/whatsapp'
import { addDays } from 'date-fns'

export const POST = withRole('billing:write', async (req, { session }) => {
    const body = await req.json()
    const parsed = paymentSchema.safeParse(body)

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const d = parsed.data

    const member = await prisma.member.findUnique({
        where: { id: d.memberId, gymId: session!.user.gymId },
        include: { gym: true },
    })
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const plan = await prisma.plan.findUnique({ where: { id: d.planId } })
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

    const paidAt = d.paidAt ? new Date(d.paidAt) : new Date()
    const baseDate = member.expiryDate > new Date() ? member.expiryDate : new Date()
    const newExpiry = addDays(baseDate, plan.durationDays)

    const [payment] = await prisma.$transaction([
        prisma.payment.create({
            data: {
                memberId: d.memberId,
                recordedById: session!.user.id,
                planId: d.planId,
                amount: d.amount,
                mode: d.mode,
                referenceNo: d.referenceNo || null,
                note: d.note || null,
                paidAt,
            },
        }),
        prisma.member.update({
            where: { id: d.memberId },
            data: { status: 'ACTIVE', expiryDate: newExpiry, planId: d.planId },
        }),
    ])

    if (d.sendReceipt && member.phone) {
        await sendReceiptWhatsApp({
            phone: member.phone,
            memberName: member.name,
            amount: d.amount,
            mode: d.mode,
            planName: plan.name,
            expiryDate: newExpiry,
            gymName: member.gym.name,
            referenceNo: d.referenceNo,
        }).catch(console.error)
    }

    return NextResponse.json({ payment, newExpiry }, { status: 201 })
})

export const GET = withRole('billing:read', async (req, { session }) => {
    const memberId = new URL(req.url).searchParams.get('memberId')

    const payments = await prisma.payment.findMany({
        where: {
            member: { gymId: session!.user.gymId },
            ...(memberId ? { memberId } : {}),
        },
        include: {
            member: { select: { name: true, phone: true } },
            recordedBy: { select: { name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(payments)
})