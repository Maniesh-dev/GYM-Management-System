import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatCurrency, getISTStartOfDay, getISTDate } from '@/lib/utils'
import { notFound } from 'next/navigation'
import { Unauthorized } from '@/components/Unauthorized'

export default async function ReportsPage() {
    const session = await auth()
    
    if (session!.user.role === 'TRAINER') {
        return <Unauthorized />
    }

    const gymId = session!.user.gymId
    const now = getISTDate()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const today = getISTStartOfDay()

    // Get basic stats
    const [totalRevenue, memberGrowth, activeMembers, expiringSoon] = await Promise.all([
        prisma.payment.aggregate({
            where: { member: { gymId }, paidAt: { gte: monthStart } },
            _sum: { amount: true },
        }),
        prisma.member.count({
            where: { gymId, joinDate: { gte: monthStart } },
        }),
        prisma.member.count({
            where: { gymId, status: 'ACTIVE' },
        }),
        prisma.member.count({
            where: {
                gymId,
                status: 'ACTIVE',
                expiryDate: { lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) }
            },
        }),
    ])

    // Get check-ins for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        return d
    }).reverse()

    const checkinStats = await Promise.all(
        last7Days.map(async (date) => {
            const nextDay = new Date(date)
            nextDay.setDate(nextDay.getDate() + 1)
            const count = await prisma.checkin.count({
                where: {
                    member: { gymId },
                    checkedAt: { gte: date, lt: nextDay }
                }
            })
            return { date, count }
        })
    )

    const cardClass = "bg-card border border-border rounded-xl p-6 shadow-sm"

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-8">Reports & Analytics</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className={cardClass}>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 opacity-60">Revenue (MTD)</p>
                    <h2 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(totalRevenue._sum.amount ?? 0)}</h2>
                </div>
                <div className={cardClass}>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 opacity-60">New Joins (MTD)</p>
                    <h2 className="text-2xl font-black text-foreground">{memberGrowth}</h2>
                </div>
                <div className={cardClass}>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 opacity-60">Active Members</p>
                    <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeMembers}</h2>
                </div>
                <div className={cardClass}>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 opacity-60">Expiring Soon</p>
                    <h2 className="text-2xl font-black text-amber-600 dark:text-amber-400">{expiringSoon}</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={cardClass}>
                    <h3 className="text-sm font-bold text-foreground mb-6 uppercase tracking-tight opacity-70">Weekly Attendance Trends</h3>
                    <div className="flex items-end justify-between h-48 gap-2">
                        {checkinStats.map((s, i) => {
                            const max = Math.max(...checkinStats.map(x => x.count), 1)
                            const height = (s.count / max) * 100
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div className="w-full bg-indigo-600/10 dark:bg-indigo-400/10 rounded-t-sm relative transition-all group-hover:bg-indigo-600/20" style={{ height: `${height}%` }}>
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{s.count} checkins</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter truncate w-full text-center">
                                        {s.date.toLocaleDateString('en-IN', { weekday: 'short' })}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className={cardClass}>
                    <h3 className="text-sm font-bold text-foreground mb-6 uppercase tracking-tight opacity-70">Growth Summary</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Your gym has seen a <span className="text-foreground font-black">{memberGrowth}</span> member increase this month.
                        <br /><br />
                        Current member retention is looking strong with <span className="text-emerald-600 font-bold">{activeMembers}</span> active members.
                        Consider reaching out to the <span className="text-amber-600 font-bold">{expiringSoon}</span> members whose plans expire within the next 7 days to maintain revenue.
                    </p>
                </div>
            </div>
        </div>
    )
}
走走