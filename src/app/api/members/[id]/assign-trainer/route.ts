import { NextResponse } from 'next/server'
import { z } from 'zod'
import { addMonths } from 'date-fns'
import { withRole } from '@/lib/withRole'
import { prisma } from '@/lib/db'

const assignTrainerSchema = z.object({
  trainerId: z.string().min(1, 'Trainer is required'),
  months: z.coerce.number().int().positive(),
})

const ALLOWED_MONTHS = [1, 3, 6, 12]

export const POST = withRole('members:write', async (req, { params, session }) => {
  const { id } = await params

  const body = await req.json()
  const parsed = assignTrainerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { trainerId, months } = parsed.data

  if (!ALLOWED_MONTHS.includes(months as 1 | 3 | 6 | 12)) {
    return NextResponse.json({ error: 'Invalid duration selected' }, { status: 400 })
  }

  const member = await prisma.member.findFirst({
    where: { id, gymId: session!.user.gymId },
    select: { id: true, expiryDate: true },
  })
  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  const trainer = await prisma.user.findFirst({
    where: {
      id: trainerId,
      gymId: session!.user.gymId,
      role: 'TRAINER',
      isActive: true,
    },
    select: { id: true },
  })
  if (!trainer) {
    return NextResponse.json({ error: 'Trainer not found' }, { status: 404 })
  }

  const assignedUntil = addMonths(new Date(), months)
  if (assignedUntil > member.expiryDate) {
    return NextResponse.json(
      { error: 'Selected duration exceeds member plan expiry date' },
      { status: 400 }
    )
  }

  await prisma.member.update({
    where: { id: member.id },
    data: { trainerId: trainer.id },
  })

  return NextResponse.json({ success: true, assignedUntil })
})
