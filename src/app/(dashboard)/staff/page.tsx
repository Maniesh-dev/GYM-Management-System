import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDate, getISTStartOfDay } from '@/lib/utils'
import { TrainerQRCard } from '@/components/staff/TrainerQRCard'
import { TerminateButton } from '@/components/staff/TerminateButton'
import Link from 'next/link'

export default async function StaffPage() {
    const session = await auth()
    const gymId = session!.user.gymId
    const todayStart = getISTStartOfDay()

    const staff = await prisma.user.findMany({
        where: { gymId, role: { in: ['TRAINER', 'RECEPTION'] }, isActive: true },
        include: {
            assignedMembers: { select: { id: true } },
            trainerCheckins: {
                where: { checkedAt: { gte: todayStart } },
                orderBy: { checkedAt: 'desc' },
                take: 1,
            },
        },
        orderBy: { createdAt: 'desc' },
    })

    return (
        <div className="p-4 md:p-[28px_32px] max-w-[900px]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-[22px] font-medium m-0">Staff ({staff.length})</h1>
                <Link
                    className='border'
                    href="/dashboard/staff/new"
                    style={{
                        background: 'var(--color-text-primary)',
                        color: 'var(--color-background-primary)',
                        padding: '8px 18px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: 'pointer'
                    }}
                >
                    + Add staff
                </Link>
            </div>

            <div className="flex flex-col gap-4">
                {staff.map((s) => {
                    const last = s.trainerCheckins[0]
                    const clockedIn = last?.type === 'IN'

                    return (
                        <div key={s.id} className='border border-gray-100/10 flex flex-col sm:flex-row gap-6 items-start sm:items-center p-5 md:p-6 bg-[var(--color-background-primary)] rounded-xl'>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                    <span style={{ fontWeight: 600, fontSize: 16 }}>{s.name}</span>
                                    <span style={{
                                        fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 500,
                                        background: s.role === 'TRAINER' ? '#EEEDFE' : '#FAEEDA',
                                        color: s.role === 'TRAINER' ? '#534AB7' : '#854F0B',
                                    }}>
                                        {s.role}
                                    </span>
                                    <span style={{
                                        fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 500,
                                        background: clockedIn ? '#E1F5EE' : '#F1EFE8',
                                        color: clockedIn ? '#085041' : '#5F5E5A',
                                    }}>
                                        {clockedIn ? '● In' : '○ Out'}
                                    </span>
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 2 }}>
                                    <div>{s.email}</div>
                                    {s.phone && <div>{s.phone}</div>}
                                    {s.role === 'TRAINER' && (
                                        <div>{s.assignedMembers.length} members assigned</div>
                                    )}
                                    {last && (
                                        <div>Last scan: {last.type} at {new Date(last.checkedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}</div>
                                    )}
                                    <div>Joined {formatDate(s.createdAt)}</div>
                                </div>
                            </div>

                            <div className="w-full sm:w-auto flex flex-col justify-center sm:block pt-4 sm:pt-0 border-t sm:border-t-0 border-border/50 gap-3">
                                <TrainerQRCard qrToken={s.qrToken} name={s.name} />
                                {session?.user?.role === 'OWNER' && (
                                    <div className="mt-3 flex justify-center sm:justify-end">
                                        <TerminateButton staffId={s.id} staffName={s.name} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
