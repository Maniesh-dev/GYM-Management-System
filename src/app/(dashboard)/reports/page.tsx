import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatCurrency, getISTDate } from '@/lib/utils'
import { RevenueChartWithFilter } from '@/components/reports/RevenueChartWithFilter'
import { PlanPieChart } from '@/components/reports/PlanPieChart'
import Link from 'next/link'

export default async function ReportsPage() {
    const session = await auth()
    const gymId = session!.user.gymId

    // Use IST-corrected dates for accurate "this month" calculations
    const now = getISTDate()
    const istMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const missingCutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    // Fetch up to 5 years ago for 'All Time' filter
    const maxHistoryDate = new Date(now.getFullYear() - 5, now.getMonth(), 1)

    const [
        totalMembers, activeMembers, expiredMembers, frozenMembers, expiringWithinWeek,
        monthRevenue, totalRevenue,
        newThisMonth, cancelledThisMonth,
        paymentsByMode, planDistribution,
        monthlyPayments, trainerStats, missingMembers, expiredMembersList,
    ] = await Promise.all([
        prisma.member.count({ where: { gymId } }),
        prisma.member.count({ where: { gymId, status: 'ACTIVE' } }),
        prisma.member.count({ where: { gymId, status: 'EXPIRED' } }),
        prisma.member.count({ where: { gymId, status: 'FROZEN' } }),
        prisma.member.count({
            where: {
                gymId,
                status: 'ACTIVE',
                expiryDate: { gte: now, lte: weekFromNow },
            },
        }),
        prisma.payment.aggregate({
            where: { member: { gymId }, paidAt: { gte: istMonthStart } },
            _sum: { amount: true },
        }),
        prisma.payment.aggregate({
            where: { member: { gymId } },
            _sum: { amount: true },
        }),
        prisma.member.count({
            where: { gymId, joinDate: { gte: istMonthStart } },
        }),
        prisma.member.count({
            where: { gymId, status: 'CANCELLED', updatedAt: { gte: istMonthStart } },
        }),
        prisma.payment.groupBy({
            by: ['mode'],
            where: { member: { gymId } },
            _sum: { amount: true },
            _count: true,
        }),
        prisma.member.groupBy({
            by: ['planId'],
            where: { gymId, status: 'ACTIVE' },
            _count: true,
        }),
        prisma.payment.findMany({
            where: { member: { gymId }, paidAt: { gte: maxHistoryDate } },
            select: { amount: true, paidAt: true },
            orderBy: { paidAt: 'asc' },
        }),
        prisma.user.findMany({
            where: { gymId, role: 'TRAINER' },
            include: { assignedMembers: { select: { id: true } } },
        }),
        prisma.member.findMany({
            where: {
                gymId,
                status: 'ACTIVE',
                checkins: {
                    none: { checkedAt: { gte: missingCutoff } },
                },
            },
            include: {
                checkins: {
                    orderBy: { checkedAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 8,
        }),
        prisma.member.findMany({
            where: {
                gymId,
                status: 'EXPIRED',
            },
            include: {
                checkins: {
                    orderBy: { checkedAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { expiryDate: 'asc' },
            take: 8,
        }),
    ])

    // Plan distribution labels
    const planIds = planDistribution.map((p) => p.planId)
    const plans = await prisma.plan.findMany({ where: { id: { in: planIds } } })
    const planData = planDistribution.map((p) => ({
        name: plans.find((pl) => pl.id === p.planId)?.name ?? 'Unknown',
        count: p._count,
    }))

    const kpi = (label: string, value: string | number, sub?: string, color = '#10b981') => (
        <div
            className="bg-card border border-border rounded-xl p-4 md:p-5 shadow-sm transition-all hover:shadow-md"
            style={{ borderLeft: `4px solid ${color}` }}
        >
            <p className="text-[11px] md:text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1 px-0">{label}</p>
            <p className="text-2xl md:text-3xl font-black text-foreground tabular-nums m-0">{value}</p>
            {sub && <p className="text-[10px] md:text-[11px] text-muted-foreground mt-1 opacity-80 m-0">{sub}</p>}
        </div>
    )

    const cardClass = "bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm"

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 md:space-y-8">
            <div>
                <h1 className="text-2xl font-black text-foreground mb-1">Reports</h1>
                <p className="text-sm text-muted-foreground">Gym performance and analytics overview</p>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {kpi('About to expire', expiringWithinWeek, 'next 7 days', '#10b981')}
                {kpi('Revenue / Month', formatCurrency(monthRevenue._sum.amount ?? 0), 'this month', '#6366f1')}
                {kpi('Total revenue', formatCurrency(totalRevenue._sum.amount ?? 0), 'all time', '#3b82f6')}
                {kpi('New this month', newThisMonth, `${cancelledThisMonth} cancelled`, '#f59e0b')}
            </div>

            {/* Member status breakdown */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[
                    { label: 'Total members', value: totalMembers, color: 'text-zinc-500', border: 'border-t-zinc-400' },
                    { label: 'Active', value: activeMembers, color: 'text-emerald-500', border: 'border-t-emerald-400' },
                    { label: 'Expired', value: expiredMembers, color: 'text-rose-500', border: 'border-t-rose-400' },
                    { label: 'Frozen', value: frozenMembers, color: 'text-blue-500', border: 'border-t-blue-400' },
                ].map(({ label, value, color, border }) => (
                    <div key={label} className={`${cardClass} text-center border-t-4 ${border}`}>
                        <p className={`text-2xl md:text-3xl font-black ${color} m-0`}>{value}</p>
                        <p className="text-[11px] md:text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1 mb-0">{label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className={`${cardClass} lg:col-span-3 flex flex-col justify-between min-h-[350px]`}>
                    <RevenueChartWithFilter monthlyPayments={monthlyPayments} />
                </div>
                <div className={`${cardClass} lg:col-span-2 flex flex-col justify-between min-h-[350px]`}>
                    <h3 className="text-sm font-bold text-foreground mb-6 opacity-80 uppercase tracking-tight">Active members by plan</h3>
                    <div className="flex-1 -ml-4">
                        <PlanPieChart data={planData} />
                    </div>
                </div>
            </div>

            {/* Payment mode breakdown + Trainer stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className={cardClass}>
                    <h3 className="text-sm font-bold text-foreground mb-5 opacity-80 uppercase tracking-tight">Payments by mode</h3>
                    <div className="space-y-4">
                        {paymentsByMode.map((m) => (
                            <div key={m.mode} className="flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full shadow-sm" style={{
                                        background: m.mode === 'CASH' ? '#10b981' : m.mode === 'UPI' ? '#6366f1' : m.mode === 'CARD' ? '#3b82f6' : m.mode === 'CHEQUE' ? '#f59e0b' : '#71717a',
                                    }} />
                                    <span className="text-sm font-semibold text-foreground">{m.mode}</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-black text-foreground">{formatCurrency(m._sum.amount ?? 0)}</div>
                                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{m._count} payments</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {paymentsByMode.length === 0 && (
                        <p className="text-sm text-muted-foreground py-8 text-center border border-dashed border-border rounded-lg mt-2">No payments yet</p>
                    )}
                </div>

                <div className={cardClass}>
                    <h3 className="text-sm font-bold text-foreground mb-5 opacity-80 uppercase tracking-tight">Trainer overview</h3>
                    <div className="space-y-4">
                        {trainerStats.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-8 text-center border border-dashed border-border rounded-lg mt-2">No trainers added</p>
                        ) : (
                            trainerStats.map((t) => (
                                <div key={t.id} className="flex justify-between items-center group">
                                    <div className="truncate pr-4">
                                        <p className="text-sm font-bold text-foreground truncate">{t.name}</p>
                                        <p className="text-[11px] text-muted-foreground truncate opacity-80">{t.email}</p>
                                    </div>
                                    <div className="flex-shrink-0 text-[11px] px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                                        {t.assignedMembers.length} members
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            <div className={cardClass}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-bold text-foreground opacity-80 uppercase tracking-tight">
                        Missing members (&gt;3 days)
                    </h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-bold border border-rose-100 dark:border-rose-900/60">
                        {missingMembers.length}
                    </span>
                </div>
                {missingMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border rounded-lg m-0">
                        No missing members
                    </p>
                ) : (
                    <div className="space-y-3">
                        {missingMembers.map((m) => (
                            <Link
                                key={m.id}
                                href={`/dashboard/members/${m.id}`}
                                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors no-underline"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate m-0">{m.name}</p>
                                    <p className="text-[11px] text-muted-foreground m-0 mt-1">
                                        Last check-in: {m.checkins[0] ? new Date(m.checkins[0].checkedAt).toLocaleDateString('en-IN') : 'Never'}
                                    </p>
                                </div>
                                <span className="text-xs font-bold text-primary whitespace-nowrap">View →</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <div className={cardClass}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-bold text-foreground opacity-80 uppercase tracking-tight">
                        Expired memberships
                    </h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-bold border border-rose-100 dark:border-rose-900/60">
                        {expiredMembersList.length}
                    </span>
                </div>
                {expiredMembersList.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border rounded-lg m-0">
                        No expired memberships
                    </p>
                ) : (
                    <div className="space-y-3">
                        {expiredMembersList.map((m) => (
                            <Link
                                key={m.id}
                                href={`/dashboard/members/${m.id}`}
                                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors no-underline"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate m-0">{m.name}</p>
                                    <p className="text-[11px] text-muted-foreground m-0 mt-1">
                                        Expired on: {new Date(m.expiryDate).toLocaleDateString('en-IN')}
                                    </p>
                                </div>
                                <span className="text-xs font-bold text-primary whitespace-nowrap">View →</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
