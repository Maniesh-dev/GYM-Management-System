import { NextResponse } from 'next/server'
import { withRole } from '@/lib/withRole'
import { prisma } from '@/lib/db'

// Terminate a staff member (set isActive = false)
export const DELETE = withRole('staff:manage', async (req, { params, session }) => {
    const { id } = params
    const gymId = session!.user.gymId

    if (!id) {
        return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })
    }

    // Ensure the staff member exists and belongs to the owner's gym
    const staff = await prisma.user.findUnique({
        where: { id, gymId }
    })

    if (!staff) {
        return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    if (staff.role === 'OWNER') {
        return NextResponse.json({ error: 'Cannot terminate the gym owner' }, { status: 403 })
    }

    // Soft delete the staff member
    await prisma.user.update({
        where: { id },
        data: { isActive: false }
    })

    return NextResponse.json({ success: true, message: 'Staff terminated successfully' }, { status: 200 })
})
