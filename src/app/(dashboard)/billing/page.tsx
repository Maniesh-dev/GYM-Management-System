import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDate, formatCurrency } from '@/lib/utils'
import { PaymentFormDialog } from '@/components/billing/PaymentForm'
import { ReceiptButton } from '@/components/billing/ReceiptButton'
import Link from 'next/link'

const MODE_STYLE: Record<string, React.CSSProperties> = {
    CASH: { background: '#E1F5EE', color: '#085041' },
    UPI: { background: '#EEEDFE', color: '#3C3489' },
    CARD: { background: '#E6F1FB', color: '#0C447C' },
    CHEQUE: { background: '#FAEEDA', color: '#633806' },
}

export default async function BillingPage({
    searchParams: searchParamsPromise,
}: {
    searchParams: Promise<{ memberId?: string }>
}) {
    const session = await auth()
    const gymId = session!.user.gymId
    const searchParams = await searchParamsPromise
    const memberId = searchParams.memberId

    const [payments, members, plans] = await Promise.all([
        prisma.payment.findMany({
            where: {
                member: { gymId },
                ...(memberId ? { memberId } : {}),
            },
            include: {
                member: { select: { id: true, name: true, phone: true } },
                recordedBy: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        }),
        prisma.member.findMany({
            where: { gymId, status: 'ACTIVE' },
            select: { id: true, name: true, phone: true, planId: true, expiryDate: true },
            orderBy: { name: 'asc' },
        }),
        prisma.plan.findMany({
            where: { gymId, isActive: true },
            orderBy: { price: 'asc' },
        }),
    ])

    const canRecord = ['OWNER', 'RECEPTION'].includes(session!.user.role)

    const totalAmount = payments.reduce((sum: number, p) => sum + p.amount, 0)

    return (
        <div className="p-4 md:p-7 max-w-[1000px]">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-[22px] font-bold text-foreground m-0 mb-1">Billing</h1>
                    <p className="text-[13px] text-muted-foreground m-0">
                        {payments.length} payments · {formatCurrency(totalAmount)} total
                    </p>
                </div>
                {canRecord && (
                    <PaymentFormDialog members={members} plans={plans} />
                )}
            </div>

            {/* Desktop Table View (lg and above) */}
            <div className="hidden lg:block bg-card border border-border rounded-xl overflow-x-auto">
                <table className="w-full border-collapse text-[13px] min-w-[800px]">
                    <thead>
                        <tr className="bg-muted border-b border-border">
                            {['Member', 'Amount', 'Mode', 'Reference', 'Date', 'Recorded by', 'Receipt'].map(h => (
                                <th key={h} className="p-3.5 text-left font-medium text-xs text-muted-foreground whitespace-nowrap">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map((p) => (
                            <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                                <td className="p-4 align-middle">
                                    <Link 
                                        href={`/dashboard/members/${p.member.id}`}
                                        className="font-semibold text-foreground hover:text-primary transition-colors inline-block"
                                    >
                                        {p.member.name}
                                    </Link>
                                    <div className="text-[11px] text-muted-foreground">{p.member.phone}</div>
                                </td>
                                <td className="p-4 align-middle font-bold text-foreground">
                                    {formatCurrency(p.amount)}
                                </td>
                                <td className="p-4 align-middle">
                                    <span style={{
                                        ...MODE_STYLE[p.mode],
                                        fontSize: 11, padding: '3px 8px',
                                        borderRadius: 4, fontWeight: 500,
                                    }}>
                                        {p.mode}
                                    </span>
                                </td>
                                <td className="p-4 align-middle text-muted-foreground whitespace-nowrap">
                                    {p.referenceNo ?? '—'}
                                </td>
                                <td className="p-4 align-middle text-muted-foreground whitespace-nowrap">
                                    {formatDate(p.paidAt)}
                                </td>
                                <td className="p-4 align-middle text-muted-foreground whitespace-nowrap">
                                    {p.recordedBy.name}
                                </td>
                                <td className="p-4 align-middle">
                                    <ReceiptButton paymentId={p.id} />
                                </td>
                            </tr>
                        ))}
                        {payments.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-12 text-center text-muted-foreground text-sm">
                                    No payments recorded yet
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View (sm and md) */}
            <div className="lg:hidden flex flex-col gap-4">
                {payments.map((p) => (
                    <div 
                        key={p.id}
                        className="bg-card border border-border rounded-xl p-4 relative hover:border-primary/50 transition-all shadow-sm active:scale-[0.98]"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <Link 
                                href={`/dashboard/members/${p.member.id}`}
                                className="flex-1 pr-12"
                            >
                                <div className="font-bold text-[15px] text-foreground hover:text-primary transition-colors truncate">
                                    {p.member.name}
                                </div>
                                <div className="text-[12px] text-muted-foreground mt-0.5">
                                    {p.member.phone}
                                </div>
                            </Link>
                            <div className="absolute top-4 right-4 z-10">
                                <ReceiptButton paymentId={p.id} />
                            </div>
                        </div>

                        <Link 
                            href={`/dashboard/members/${p.member.id}`}
                            className="block"
                        >
                            <div className="flex items-end justify-between">
                                <div>
                                    <div className="text-[18px] font-black text-foreground">
                                        {formatCurrency(p.amount)}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span style={{
                                            ...MODE_STYLE[p.mode],
                                            fontSize: 10, padding: '2px 7px',
                                            borderRadius: 4, fontWeight: 600,
                                            letterSpacing: '0.02em'
                                        }}>
                                            {p.mode}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground font-medium">
                                            {formatDate(p.paidAt)}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                                        Recorded by
                                    </div>
                                    <div className="text-[12px] font-semibold text-foreground">
                                        {p.recordedBy.name}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
                
                {payments.length === 0 && (
                    <div className="bg-card border border-border border-dashed rounded-xl p-12 text-center text-muted-foreground text-sm">
                        No payments recorded yet
                    </div>
                )}
            </div>
        </div>
    )
}
