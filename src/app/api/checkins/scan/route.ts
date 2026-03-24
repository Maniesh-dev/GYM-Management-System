import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { token, type } = body

        console.log('=== QR SCAN ===')
        console.log('Token received:', token ? token.slice(0, 8) + '...' : 'MISSING')
        console.log('Type received:', type)

        if (!token || !type) {
            return NextResponse.json(
                { status: 'INVALID', message: 'Missing token or type' },
                { status: 400 }
            )
        }

        // ── TRAINER scan ────────────────────────────────────────────────
        if (type === 'trainer') {
            const user = await prisma.user.findUnique({
                where: { qrToken: token },
                include: { gym: { select: { name: true } } },
            })

            console.log('Trainer lookup:', user ? `Found: ${user.name}` : 'NOT FOUND')

            if (!user || user.role === 'OWNER') {
                return NextResponse.json(
                    { status: 'INVALID', message: 'Unknown trainer QR code' },
                    { status: 404 }
                )
            }

            const todayStart = new Date()
            todayStart.setHours(0, 0, 0, 0)

            const lastLog = await prisma.trainerCheckin.findFirst({
                where: { userId: user.id, checkedAt: { gte: todayStart } },
                orderBy: { checkedAt: 'desc' },
            })

            const checkType = !lastLog || lastLog.type === 'OUT' ? 'IN' : 'OUT'

            await prisma.trainerCheckin.create({
                data: { userId: user.id, gymId: user.gymId, type: checkType },
            })

            console.log(`Trainer ${user.name} clocked ${checkType}`)

            return NextResponse.json({
                status: 'SUCCESS',
                scanType: 'TRAINER',
                checkType,
                name: user.name,
                role: user.role,
                gymName: user.gym.name,
                checkedAt: new Date(),
            })
        }

        // ── MEMBER scan ──────────────────────────────────────────────────
        if (type === 'member') {
            const member = await prisma.member.findUnique({
                where: { qrToken: token },
                include: {
                    plan: { select: { name: true } },
                    trainer: { select: { name: true } },
                },
            })

            console.log('Member lookup:', member ? `Found: ${member.name}` : 'NOT FOUND')

            if (!member) {
                return NextResponse.json(
                    { status: 'INVALID', message: 'Unknown member QR code' },
                    { status: 404 }
                )
            }

            if (member.status === 'FROZEN') {
                return NextResponse.json({
                    status: 'FROZEN',
                    scanType: 'MEMBER',
                    name: member.name,
                    message: 'Membership is currently frozen',
                })
            }

            if (member.status !== 'ACTIVE' || member.expiryDate < new Date()) {
                return NextResponse.json({
                    status: 'EXPIRED',
                    scanType: 'MEMBER',
                    name: member.name,
                    expiryDate: member.expiryDate,
                })
            }

            // Prevent duplicate check-in within 1 hour
            const recentCheckin = await prisma.checkin.findFirst({
                where: {
                    memberId: member.id,
                    checkedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
                },
            })

            if (recentCheckin) {
                return NextResponse.json({
                    status: 'ALREADY_IN',
                    scanType: 'MEMBER',
                    name: member.name,
                    message: 'Already checked in within the last hour',
                })
            }

            await prisma.checkin.create({
                data: { memberId: member.id, method: 'QR' },
            })

            console.log(`Member ${member.name} checked in`)

            return NextResponse.json({
                status: 'SUCCESS',
                scanType: 'MEMBER',
                name: member.name,
                photoUrl: member.photoUrl,
                plan: member.plan.name,
                trainer: member.trainer?.name ?? null,
                expiryDate: member.expiryDate,
                checkedAt: new Date(),
            })
        }

        return NextResponse.json(
            { status: 'INVALID', message: `Unknown scan type: ${type}` },
            { status: 400 }
        )

    } catch (error) {
        console.error('Scan API error:', error)
        return NextResponse.json(
            { status: 'INVALID', message: 'Server error. Try again.' },
            { status: 500 }
        )
    }
}