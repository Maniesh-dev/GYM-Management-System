import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getISTStartOfDay, getISTDayBoundaries, getISTDateString } from '@/lib/utils'
import { notFound } from 'next/navigation'
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

    const dateStr = searchParams.date ?? getISTDateString()
    const { dayStart, dayEnd } = getISTDayBoundaries(dateStr)

    const fmt = (d: Date) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })

    const [memberCheckins, trainerCheckins] = await Promise.all([
        prisma.checkin.findMany({
            where: { member: { gymId }, checkedAt: { gte: dayStart, lte: dayEnd } },
            include: {
                member: { select: { name: true, phone: true, plan: { select: { name: true } } } },
            },
            orderBy: { checkedAt: 'desc' },
        }),
        prisma.trainerCheckin.findMany({
            where: { 
                gymId, 
                ...(isTrainer ? { userId: session!.user.id } : {}),
                checkedAt: { gte: dayStart, lte: dayEnd } 
            },
            include: { user: { select: { name: true, role: true } } },
            orderBy: { checkedAt: 'desc' }
        }),
    ])

    return (
        <div className="p-4 md:p-7 max-w-[900px]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-[22px] font-bold text-foreground m-0 mb-1">Check-ins</h1>
                    <p className="text-[13px] text-muted-foreground m-0">{dateStr === getISTDateString() ? 'Today' : dateStr} — {memberCheckins.length} members, {trainerCheckins.length} {isTrainer ? 'personal' : 'staff'} scans</p>
                </div>
                <div className="flex items-center gap-3">
                    <form className="flex items-center gap-2">
                        <input
                            name="date"
                            type="date"
                            defaultValue={dateStr}
                            className="px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button type="submit" className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-bold hover:brightness-95 transition-all">
                            Filter
                        </button>
                    </form>
                    {!isTrainer && (
                        <a
                            href="/checkins/manual"
                            className="px-4 py-2 bg-foreground text-background rounded-lg text-sm font-bold hover:opacity-90 transition-opacity whitespace-nowrap"
                        >
                            + Manual check-in
                        </a>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">

                {/* Member check-ins */}
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    <div className="p-3.5 border-b border-border bg-muted text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Member check-ins ({memberCheckins.length})
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                        {memberCheckins.length === 0 ? (
                            <p className="p-12 text-center text-muted-foreground text-sm">No check-ins yet</p>
                        ) : (
                            memberCheckins.map((c) => {
                                const content = (
                                    <>
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
                                    </>
                                )

                                return isTrainer ? (
                                    <div key={c.id} className="flex justify-between items-center p-3.5 border-b border-border last:border-0 opacity-90 cursor-default">
                                        {content}
                                    </div>
                                ) : (
                                    <Link
                                        href={`/members/${c.memberId}`}
                                        key={c.id}
                                        className="flex justify-between items-center p-3.5 border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                                    >
                                        {content}
                                    </Link>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Trainer attendance */}
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    <div className="p-3.5 border-b border-border bg-muted text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {isTrainer ? 'My attendance' : 'Staff attendance'}
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                        {trainerCheckins.length === 0 ? (
                            <p className="p-12 text-center text-muted-foreground text-sm">No scans yet</p>
                        ) : (
                            trainerCheckins.map((c) => (
                                <div key={c.id} className="flex justify-between items-center p-3.5 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
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
