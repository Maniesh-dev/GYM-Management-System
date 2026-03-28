import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ApproveButton } from '@/components/staff/ApproveButton'
import { getISTDateString, getISTDayBoundaries } from '@/lib/utils'
import { Unauthorized } from '@/components/Unauthorized'

export default async function AttendancePage({
    searchParams: searchParamsPromise,
}: {
    searchParams: Promise<{ date?: string; userId?: string }>
}) {
    const session = await auth()
    
    if (session!.user.role === 'TRAINER') {
        return <Unauthorized />
    }

    const gymId = session!.user.gymId
    const searchParams = await searchParamsPromise
    type AttendanceLog = {
        id: string
        checkedAt: Date
        type: string
        method: string
        status: string
    }

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
        logs: AttendanceLog[]
        hoursWorked: number
        currentlyClockedIn: boolean
    }> = {}

    // Initialize with selected staff member(s)
    staff.forEach(s => {
        // If a specific user is selected, only initialize for that user
        if (searchParams.userId && s.id !== searchParams.userId) return;

        byUser[s.id] = {
            name: s.name, role: s.role,
            logs: [], hoursWorked: 0, currentlyClockedIn: false,
        }
    })

    logs.forEach((l) => {
        if (byUser[l.userId]) {
            byUser[l.userId].logs.push(l as any)
        }
    })

    // Calculate hours from IN/OUT pairs
    Object.values(byUser).forEach(u => {
        let totalMs = 0
        let lastIn: Date | null = null
        let lastApprovedType: 'IN' | 'OUT' | null = null
        u.logs.forEach(l => {
            // Only count approved check-ins for hours
            if (l.status === 'PENDING') return

            if (l.type === 'IN') {
                lastIn = l.checkedAt
                lastApprovedType = 'IN'
            } else if (l.type === 'OUT' && lastIn) {
                totalMs += l.checkedAt.getTime() - lastIn.getTime()
                lastIn = null
                lastApprovedType = 'OUT'
            }
        })
        u.hoursWorked = totalMs / (1000 * 60 * 60)
        u.currentlyClockedIn = lastApprovedType === 'IN'
    })

    const fmt = (d: Date) =>
        new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })

    const isOwner = session!.user.role === 'OWNER'

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-6">Staff Attendance</h1>

            {/* Filters */}
            <form className="flex flex-wrap gap-3 mb-8 bg-card border border-border p-4 rounded-xl shadow-sm">
                <input
                    name="date"
                    type="date"
                    defaultValue={dateStr}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <select
                    name="userId"
                    defaultValue={searchParams.userId ?? ''}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring min-w-[180px]"
                >
                    <option value="">All staff members</option>
                    {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name} ({s.role.toLowerCase()})
                        </option>
                    ))}
                </select>
                <button type="submit" className="px-5 py-2 bg-foreground text-background rounded-lg text-sm font-bold hover:opacity-90 transition-all">
                    Filter
                </button>
            </form>

            {Object.keys(byUser).length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-16 text-center">
                    <p className="text-sm text-muted-foreground italic">
                        No attendance records found for this date.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(byUser).map(([userId, data]) => (
                        <div key={userId} className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-[15px] font-bold text-foreground">{data.name}</p>
                                    <span className={`
                                        inline-block mt-1 text-[10px] uppercase font-black px-2 py-0.5 rounded-md border
                                        ${data.role === 'TRAINER'
                                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400'
                                            : 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'}
                                    `}>
                                        {data.role}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-foreground">
                                        {data.hoursWorked > 0
                                            ? `${data.hoursWorked.toFixed(1)} hrs`
                                            : data.currentlyClockedIn
                                                ? 'Clocked in'
                                                : '0.0 hrs'}
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
                                                ? 'bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400'
                                                : 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-800/50 text-blue-700 dark:text-blue-400'}
                                            ${l.status === 'PENDING' ? 'opacity-70 border-dashed border-amber-300 dark:border-amber-700' : ''}
                                        `}>
                                            <span className={`w-2 h-2 rounded-full ${l.type === 'IN' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                            <span>{l.type}</span>
                                            <span className="opacity-60 tabular-nums">{fmt(l.checkedAt)}</span>
                                            {l.method === 'MANUAL' && <span className="opacity-40 text-[10px]" title="Manual Entry">✎</span>}

                                            {l.status === 'PENDING' && (
                                                <div className="flex items-center gap-2 pl-2 border-l border-amber-200 dark:border-amber-800 ml-1">
                                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-tighter">Pending</span>
                                                    {isOwner && <ApproveButton id={l.id} />}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-[11px] text-muted-foreground italic px-1">
                                        No activity logged
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
走走
