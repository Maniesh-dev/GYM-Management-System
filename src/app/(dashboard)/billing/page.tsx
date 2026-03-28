import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatCurrency, formatDate } from '@/lib/utils'
import { notFound } from 'next/navigation'
import { Unauthorized } from '@/components/Unauthorized'

export default async function BillingPage() {
    const session = await auth()

    if (session!.user.role === 'TRAINER') {
        return <Unauthorized />
    }

    const gymId = session!.user.gymId

    // Get recent payments for this gym
    const payments = await prisma.payment.findMany({
        where: { member: { gymId } },
        include: {
            member: { select: { name: true, phone: true } },
            recordedBy: { select: { name: true } },
        },
        orderBy: { paidAt: 'desc' },
        take: 50,
    })

    // Calculate basic stats
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const stats = await prisma.payment.aggregate({
        where: { member: { gymId }, paidAt: { gte: monthStart } },
        _sum: { amount: true },
        _count: true,
    })

    const cardClass = "bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center"

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Billing & Payments</h1>
                    <p className="text-sm text-muted-foreground mt-1">Review your revenue and transaction history.</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
                <div className={cardClass}>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 opacity-60">Revenue this month</p>
                    <h2 className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(stats._sum.amount ?? 0)}
                    </h2>
                </div>
                <div className={cardClass}>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 opacity-60">Total Transactions</p>
                    <h2 className="text-3xl font-black text-foreground">
                        {stats._count}
                    </h2>
                </div>
            </div>

            {/* Payments list */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border bg-muted/30">
                    <h3 className="text-sm font-bold text-foreground m-0">Transaction History</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Last 50 payments processed.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                        <thead>
                            <tr className="bg-muted text-[11px] font-black uppercase text-muted-foreground tracking-wider border-b border-border">
                                <th className="p-4">Member</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Mode</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Recorded By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-muted-foreground italic">No payments found.</td>
                                </tr>
                            ) : (
                                payments.map((p) => (
                                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-4">
                                            <p className="font-bold text-foreground m-0">{p.member.name}</p>
                                            <p className="text-xs text-muted-foreground m-0 mt-0.5">{p.member.phone}</p>
                                        </td>
                                        <td className="p-4 font-black text-indigo-600 dark:text-indigo-400">
                                            {formatCurrency(p.amount)}
                                        </td>
                                        <td className="p-4">
                                            <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 font-black tracking-widest">
                                                {p.mode}
                                            </span>
                                        </td>
                                        <td className="p-4 text-muted-foreground font-medium whitespace-nowrap">
                                            {formatDate(p.paidAt)}
                                        </td>
                                        <td className="p-4 text-muted-foreground text-xs font-medium">
                                            {p.recordedBy.name}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}