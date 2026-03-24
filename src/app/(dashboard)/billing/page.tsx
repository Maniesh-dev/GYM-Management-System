import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDate, formatCurrency } from '@/lib/utils'
import { PaymentFormDialog } from '@/components/billing/PaymentForm'
import { ReceiptButton } from '@/components/billing/ReceiptButton'

const MODE_STYLE: Record<string, React.CSSProperties> = {
    CASH: { background: '#E1F5EE', color: '#085041' },
    UPI: { background: '#EEEDFE', color: '#3C3489' },
    CARD: { background: '#E6F1FB', color: '#0C447C' },
    CHEQUE: { background: '#FAEEDA', color: '#633806' },
}

export default async function BillingPage({
    searchParams,
}: {
    searchParams: { memberId?: string }
}) {
    const session = await auth()
    const gymId = session!.user.gymId
    const memberId = searchParams.memberId

    const [payments, members, plans] = await Promise.all([
        prisma.payment.findMany({
            where: {
                member: { gymId },
                ...(memberId ? { memberId } : {}),
            },
            include: {
                member: { select: { name: true, phone: true } },
                recordedBy: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        }),
        prisma.member.findMany({
            where: { gymId, status: 'ACTIVE' },
            select: { id: true, name: true, phone: true, planId: true },
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

            {/* Payment table wrapper with horizontal scroll */}
            <div className="bg-card border border-border rounded-xl overflow-x-auto">
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
                            <tr key={p.id} className="border-b border-border last:border-0">
                                <td className="p-4 align-middle">
                                    <div className="font-semibold text-foreground">{p.member.name}</div>
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
        </div>
    )
}