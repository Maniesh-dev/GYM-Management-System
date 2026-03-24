import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatCurrency } from '@/lib/utils'
import { RevenueChart } from '@/components/reports/RevenueChart'
import { PlanPieChart } from '@/components/reports/PlanPieChart'

export default async function ReportsPage() {
    const session = await auth()
    const gymId = session!.user.gymId

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const [
        totalMembers, activeMembers, expiredMembers, frozenMembers,
        monthRevenue, totalRevenue,
        newThisMonth, cancelledThisMonth,
        paymentsByMode, planDistribution,
        monthlyPayments, trainerStats,
    ] = await Promise.all([
        prisma.member.count({ where: { gymId } }),
        prisma.member.count({ where: { gymId, status: 'ACTIVE' } }),
        prisma.member.count({ where: { gymId, status: 'EXPIRED' } }),
        prisma.member.count({ where: { gymId, status: 'FROZEN' } }),
        prisma.payment.aggregate({
            where: { member: { gymId }, paidAt: { gte: monthStart } },
            _sum: { amount: true },
        }),
        prisma.payment.aggregate({
            where: { member: { gymId } },
            _sum: { amount: true },
        }),
        prisma.member.count({
            where: { gymId, joinDate: { gte: monthStart } },
        }),
        prisma.member.count({
            where: { gymId, status: 'CANCELLED', updatedAt: { gte: monthStart } },
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
            where: { member: { gymId }, paidAt: { gte: sixMonthsAgo } },
            select: { amount: true, paidAt: true },
            orderBy: { paidAt: 'asc' },
        }),
        prisma.user.findMany({
            where: { gymId, role: 'TRAINER' },
            include: { assignedMembers: { select: { id: true } } },
        }),
    ])

    // Build monthly revenue buckets
    const monthBuckets: Record<string, number> = {}
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
        monthBuckets[key] = 0
    }
    monthlyPayments.forEach((p) => {
        const key = new Date(p.paidAt).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
        if (key in monthBuckets) monthBuckets[key] += p.amount
    })

    const revenueData = Object.entries(monthBuckets).map(([month, amount]) => ({ month, amount }))

    // Plan distribution labels
    const planIds = planDistribution.map((p) => p.planId)
    const plans = await prisma.plan.findMany({ where: { id: { in: planIds } } })
    const planData = planDistribution.map((p) => ({
        name: plans.find((pl) => pl.id === p.planId)?.name ?? 'Unknown',
        count: p._count,
    }))

    const kpi = (label: string, value: string | number, sub?: string, color = '#1D9E75') => (
        <div style={{
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 12, padding: '16px 20px',
            borderLeft: `3px solid ${color}`,
        }}>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>{label}</p>
            <p style={{ fontSize: 26, fontWeight: 600 }}>{value}</p>
            {sub && <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{sub}</p>}
        </div>
    )

    const card: React.CSSProperties = {
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 12, padding: '20px 24px',
    }

    return (
        <div style={{ padding: '28px 32px', maxWidth: 1000 }}>
            <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 24 }}>Reports</h1>

            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
                {kpi('Active members', activeMembers, `${expiredMembers} expired`, '#1D9E75')}
                {kpi('Revenue this month', formatCurrency(monthRevenue._sum.amount ?? 0), undefined, '#534AB7')}
                {kpi('Total revenue', formatCurrency(totalRevenue._sum.amount ?? 0), 'all time', '#185FA5')}
                {kpi('New this month', newThisMonth, `${cancelledThisMonth} cancelled`, '#BA7517')}
            </div>

            {/* Member status breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
                {[
                    { label: 'Total members', value: totalMembers, color: '#888780' },
                    { label: 'Active', value: activeMembers, color: '#1D9E75' },
                    { label: 'Expired', value: expiredMembers, color: '#E24B4A' },
                    { label: 'Frozen', value: frozenMembers, color: '#378ADD' },
                ].map(({ label, value, color }) => (
                    <div key={label} style={{ ...card, textAlign: 'center', borderTop: `3px solid ${color}` }}>
                        <p style={{ fontSize: 28, fontWeight: 600, color }}>{value}</p>
                        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>{label}</p>
                    </div>
                ))}
            </div>

            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 16 }}>
                <div style={card}>
                    <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Monthly revenue (last 6 months)</h3>
                    <RevenueChart data={revenueData} />
                </div>
                <div style={card}>
                    <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Active members by plan</h3>
                    <PlanPieChart data={planData} />
                </div>
            </div>

            {/* Payment mode breakdown + Trainer stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                <div style={card}>
                    <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>Payments by mode</h3>
                    {paymentsByMode.map((m) => (
                        <div key={m.mode} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    background: m.mode === 'CASH' ? '#1D9E75' : m.mode === 'UPI' ? '#534AB7' : m.mode === 'CARD' ? '#185FA5' : m.mode === 'CHEQUE' ? '#BA7517' : '#888',
                                }} />
                                <span style={{ fontSize: 13 }}>{m.mode}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 13, fontWeight: 500 }}>{formatCurrency(m._sum.amount ?? 0)}</div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{m._count} payments</div>
                            </div>
                        </div>
                    ))}
                    {paymentsByMode.length === 0 && (
                        <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>No payments yet</p>
                    )}
                </div>

                <div style={card}>
                    <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>Trainer overview</h3>
                    {trainerStats.length === 0 ? (
                        <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>No trainers added</p>
                    ) : (
                        trainerStats.map((t) => (
                            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 500 }}>{t.name}</p>
                                    <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{t.email}</p>
                                </div>
                                <div style={{
                                    fontSize: 12, padding: '3px 10px', borderRadius: 4,
                                    background: '#EEEDFE', color: '#534AB7', fontWeight: 500,
                                }}>
                                    {t.assignedMembers.length} members
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    )
}