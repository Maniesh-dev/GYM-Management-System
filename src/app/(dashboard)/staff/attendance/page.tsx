import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ApproveButton } from '@/components/staff/ApproveButton'
import { getISTDateString, getISTDayBoundaries } from '@/lib/utils'

export default async function AttendancePage({
    searchParams: searchParamsPromise,
}: {
    searchParams: Promise<{ date?: string; userId?: string }>
}) {
    const session = await auth()
    const gymId = session!.user.gymId
    const searchParams = await searchParamsPromise

    // Get current date string in IST if no date selected
    const dateStr = searchParams.date ?? getISTDateString()
    const { dayStart, dayEnd } = getISTDayBoundaries(dateStr)

    const [logs, staff] = await Promise.all([
        prisma.trainerCheckin.findMany({
            where: {
                gymId,
                checkedAt: { gte: dayStart, lte: dayEnd },
                ...(searchParams.userId ? { userId: searchParams.userId } : {}),
            },
            include: { user: { select: { name: true, role: true } } },
            orderBy: { checkedAt: 'asc' },
        }),
        prisma.user.findMany({
            where: { gymId, role: { in: ['TRAINER', 'RECEPTION'] } },
            select: { id: true, name: true, role: true },
            orderBy: { name: 'asc' },
        }),
    ])

    // Group logs by user and calculate hours
    const byUser: Record<string, {
        name: string; role: string
        logs: any[]
        hoursWorked: number
    }> = {}

    // Initialize with selected staff member(s)
    staff.forEach(s => {
        // If a specific user is selected, only initialize for that user
        if (searchParams.userId && s.id !== searchParams.userId) return;

        byUser[s.id] = {
            name: s.name, role: s.role,
            logs: [], hoursWorked: 0,
        }
    })

    logs.forEach((l) => {
        if (byUser[l.userId]) {
            byUser[l.userId].logs.push(l)
        }
    })

    // Calculate hours from IN/OUT pairs
    Object.values(byUser).forEach(u => {
        let totalMs = 0
        let lastIn: Date | null = null
        u.logs.forEach(l => {
            // Only count approved check-ins for hours
            if (l.status === 'PENDING') return

            if (l.type === 'IN') {
                lastIn = l.checkedAt
            } else if (l.type === 'OUT' && lastIn) {
                totalMs += l.checkedAt.getTime() - lastIn.getTime()
                lastIn = null
            }
        })
        u.hoursWorked = totalMs / (1000 * 60 * 60)
    })

    const fmt = (d: Date) =>
        new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

    const card: React.CSSProperties = {
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 12, padding: '20px 24px',
    }

    const isOwner = session!.user.role === 'OWNER'

    return (
        <div style={{ padding: '28px 32px', maxWidth: 800 }}>
            <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 20 }}>Staff attendance</h1>

            {/* Filters */}
            <form style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <input
                    name="date"
                    type="date"
                    defaultValue={dateStr}
                    style={{
                        padding: '8px 12px', borderRadius: 8, fontSize: 13,
                        border: '0.5px solid var(--color-border-secondary)',
                        background: 'var(--color-background-primary)',
                        color: 'var(--color-text-primary)',
                    }}
                />
                <select
                    name="userId"
                    defaultValue={searchParams.userId ?? ''}
                    className='border border-zinc-100/10 px-2'
                    style={{
                        padding: '8px 12px', borderRadius: 8, fontSize: 13,
                        background: 'var(--color-background-primary)',
                        color: 'var(--color-text-primary)',
                    }}
                >
                    <option value="" className='text-black px-2'>All staff</option>
                    {staff.map((s) => (
                        <option key={s.id} value={s.id} className='text-black px-2'>
                            {s.name}
                        </option>
                    ))}
                </select>
                <button type="submit" className='border border-zinc-100/10'
                    style={{
                        padding: '8px 16px', borderRadius: 8, fontSize: 13,
                        background: 'var(--color-background-secondary)',
                        cursor: 'pointer', color: 'var(--color-text-primary)',
                    }}>
                    Filter
                </button>
            </form>

            {Object.keys(byUser).length === 0 ? (
                <div style={{ ...card, textAlign: 'center', padding: 40 }}>
                    <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>
                        No attendance records for {dateStr}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {Object.entries(byUser).map(([userId, data]) => (
                        <div key={userId} className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-[15px] font-bold text-foreground">{data.name}</h3>
                                    <span className={`
                                        inline-block mt-1 text-[10px] uppercase font-black px-2 py-0.5 rounded-md border
                                        ${data.role === 'TRAINER' 
                                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400' 
                                            : 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900 text-amber-700 dark:text-amber-400'}
                                    `}>
                                        {data.role}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-foreground">
                                        {data.hoursWorked > 0
                                            ? `${data.hoursWorked.toFixed(1)} hrs`
                                            : 'Clocked in'}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        {data.logs.length} records today
                                    </p>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="flex flex-wrap gap-2">
                                {data.logs.length > 0 ? (
                                    data.logs.map((l, i) => (
                                        <div key={i} className={`
                                            flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                                            ${l.type === 'IN' 
                                                ? 'bg-[#1D9E7510] border-[#1D9E7530] text-[#1D9E75]' 
                                                : 'bg-[#185FA510] border-[#185FA530] text-[#185FA5]'}
                                            ${l.status === 'PENDING' ? 'opacity-70 border-dashed border-[#BA751750]' : ''}
                                        `}>
                                            <span className={`w-2 h-2 rounded-full ${l.type === 'IN' ? 'bg-[#1D9E75]' : 'bg-[#185FA5]'}`} />
                                            <span>{l.type}</span>
                                            <span className="opacity-60 tabular-nums">{fmt(l.checkedAt)}</span>
                                            {l.method === 'MANUAL' && <span className="opacity-40 text-[10px]" title="Manual Entry">✎</span>}
                                            
                                            {l.status === 'PENDING' && (
                                                <div className="flex items-center gap-2 pl-2 border-l border-[#BA751730] ml-1">
                                                    <span className="text-[10px] text-[#BA7517] font-black uppercase tracking-tighter">Pending</span>
                                                    {isOwner && <ApproveButton id={l.id} />}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-[11px] text-muted-foreground italic px-1">
                                        No activity logged today
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}