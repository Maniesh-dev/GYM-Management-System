import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getISTDateString, getISTDayBoundaries, getISTStartOfDay } from '@/lib/utils'
import Link from 'next/link'

export default async function CheckinsPage({
    searchParams: searchParamsPromise,
}: {
    searchParams: Promise<{ date?: string }>
}) {
    const session = await auth()
    const gymId = session!.user.gymId
    const isTrainer = session!.user.role === 'TRAINER'
    const searchParams = await searchParamsPromise

    const todayStart = getISTStartOfDay()
    const dateStr = searchParams.date ?? getISTDateString()
    const { dayStart, dayEnd } = getISTDayBoundaries(dateStr)

    const memberCheckins = await prisma.checkin.findMany({
        where: isTrainer
            ? { member: { gymId }, checkedAt: { gte: dayStart, lte: dayEnd } }
            : { member: { gymId }, checkedAt: { gte: todayStart } },
        include: {
            member: { select: { name: true, phone: true, plan: { select: { name: true } } } },
        },
        orderBy: { checkedAt: 'desc' },
    })

    const trainerCheckins = await prisma.trainerCheckin.findMany({
        where: isTrainer
            ? { gymId, userId: session!.user.id, checkedAt: { gte: dayStart, lte: dayEnd } }
            : { gymId, checkedAt: { gte: todayStart } },
        include: { user: { select: { name: true, role: true } } },
        orderBy: { checkedAt: 'desc' },
    })

    const fmt = (d: Date) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })

    const gridClass = isTrainer
        ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
        : 'grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4'

    return (
        <div className="p-4 md:p-7 max-w-[900px]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-[22px] font-bold text-foreground m-0 mb-1">Check-ins</h1>
                    <p className="text-[13px] text-muted-foreground m-0">
                        {isTrainer
                            ? `${dateStr} - ${trainerCheckins.length} staff scans`
                            : `Today — ${memberCheckins.length} members, ${trainerCheckins.length} staff scans`}
                    </p>
                </div>
                {!isTrainer && (
                    <a
                        href="/checkins/manual"
                        className="px-4 py-2 bg-foreground text-background rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                    >
                        + Manual check-in
                    </a>
                )}
            </div>

            {isTrainer && (
                <form className="flex items-center gap-2 mb-4">
                    <input
                        name="date"
                        type="date"
                        defaultValue={dateStr}
                        className="px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-foreground text-background rounded-lg text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer"
                    >
                        Filter
                    </button>
                </form>
            )}

            <div className={gridClass}>
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="p-3.5 border-b border-border bg-muted text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Member check-ins {isTrainer ? `(${dateStr})` : 'today'} ({memberCheckins.length})
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                        {memberCheckins.length === 0 ? (
                            <p className="p-12 text-center text-muted-foreground text-sm">No check-ins yet</p>
                        ) : (
                            memberCheckins.map((c) => (
                                isTrainer ? (
                                    <div
                                        key={c.id}
                                        className="flex justify-between items-center p-3.5 border-b border-border last:border-0"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-semibold text-foreground text-sm truncate">{c.member.name}</p>
                                            <p className="text-[11px] text-muted-foreground truncate">
                                                {c.member.plan.name} · {c.member.phone}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm font-medium text-foreground">{fmt(c.checkedAt)}</p>
                                            <p className="text-[10px] uppercase font-bold text-green-600 dark:text-green-400 mt-1">{c.method}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <Link
                                        href={`/members/${c.memberId}`}
                                        key={c.id}
                                        className="flex justify-between items-center p-3.5 border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-semibold text-foreground text-sm truncate">{c.member.name}</p>
                                            <p className="text-[11px] text-muted-foreground truncate">
                                                {c.member.plan.name} · {c.member.phone}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm font-medium text-foreground">{fmt(c.checkedAt)}</p>
                                            <p className="text-[10px] uppercase font-bold text-green-600 dark:text-green-400 mt-1">{c.method}</p>
                                        </div>
                                    </Link>
                                )
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="p-3.5 border-b border-border bg-muted text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {isTrainer ? `My attendance (${dateStr})` : 'Trainer attendance today'}
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                        {trainerCheckins.length === 0 ? (
                            <p className="p-12 text-center text-muted-foreground text-sm">No trainer scans yet</p>
                        ) : (
                            trainerCheckins.map((c) => (
                                <div key={c.id} className="flex justify-between items-center p-3.5 border-b border-border last:border-0">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-foreground text-sm truncate">{c.user.name}</p>
                                        <p className="text-[11px] text-muted-foreground truncate">{c.user.role}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <span className={`
                                            inline-block text-[10px] px-2 py-0.5 rounded font-bold uppercase
                                            ${c.type === 'IN'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'}
                                        `}>
                                            {c.type}
                                        </span>
                                        <p className="text-[11px] text-muted-foreground mt-1.5">{fmt(c.checkedAt)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
