import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { formatDate, formatCurrency, daysUntil } from '@/lib/utils'
import { MemberQRCard } from '@/components/members/MemberQRCard'
import { MemberStatusActions } from '@/components/members/MemberStatusActions'
import { PaymentFormDialog } from '@/components/billing/PaymentForm'
import { Unauthorized } from '@/components/Unauthorized'

export default async function MemberProfilePage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const session = await auth()
    const { id } = await params

    if (session!.user.role === 'TRAINER') {
        return <Unauthorized />
    }

    const member = await prisma.member.findUnique({
        where: {
            id,
            gymId: session!.user.gymId,
        },
        include: {
            plan: true,
            trainer: { select: { name: true } },
            payments: {
                orderBy: { paidAt: 'desc' },
                take: 8,
                include: { recordedBy: { select: { name: true } } },
            },
            checkins: { orderBy: { checkedAt: 'desc' }, take: 10 },
        },
    })

    if (!member) notFound()

    const STATUS_COLOR: Record<string, string> = {
        ACTIVE: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20',
        EXPIRED: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20',
        FROZEN: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20',
        CANCELLED: 'text-zinc-500 bg-zinc-50 dark:bg-zinc-500/10 border-zinc-100 dark:border-zinc-500/20',
    }

    const cardClass = "bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm"
    const lblClass = "text-sm text-muted-foreground"
    const valClass = "text-sm font-semibold text-foreground"

    const canBill = ['OWNER', 'RECEPTION'].includes(session!.user.role)
    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-black text-foreground">{member.name}</h1>
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${STATUS_COLOR[member.status]}`}>
                            {member.status}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {member.phone} {member.email ? `· ${member.email}` : ''}
                    </p>
                </div>
                <div className="flex w-full sm:w-auto gap-2 items-center">
                    {canBill && (
                        <div className="flex-1 sm:flex-none">
                            <PaymentFormDialog
                                members={[{ id: member.id, name: member.name, phone: member.phone, planId: member.planId }]}
                                plans={await prisma.plan.findMany({ where: { gymId: session!.user.gymId, isActive: true } })}
                                preselectedMemberId={member.id}
                            />
                        </div>
                    )}
                    <div className="flex-[2] sm:flex-none">
                        <MemberStatusActions memberId={member.id} currentStatus={member.status} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Membership info */}
                <div className={cardClass}>
                    <h3 className="text-sm font-bold text-foreground mb-4 opacity-80 uppercase tracking-tight">Membership</h3>
                    <div className="flex flex-col gap-3.5">
                        {[
                            ['Plan', member.plan.name],
                            ['Joined', formatDate(member.joinDate)],
                            ['Expires', formatDate(member.expiryDate)],
                            ['Days left', member.status === 'ACTIVE' ? `${daysUntil(member.expiryDate)} days` : '—'],
                            ['Trainer', member.trainer?.name ?? 'Not assigned'],
                        ].map(([label, value]) => (
                            <div key={label} className="flex justify-between items-center border-b border-border/40 last:border-0 pb-3 last:pb-0">
                                <span className={lblClass}>{label}</span>
                                <span className={valClass}>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* QR code */}
                <div className={cardClass}>
                    <h3 className="text-sm font-bold text-foreground mb-4 opacity-80 uppercase tracking-tight">Entry QR code</h3>
                    <div className="flex justify-center md:block">
                        <MemberQRCard memberId={member.id} memberName={member.name} qrToken={member.qrToken} />
                    </div>
                </div>

                {/* Recent payments */}
                <div className={cardClass}>
                    <h3 className="text-sm font-bold text-foreground mb-4 opacity-80 uppercase tracking-tight">Payment history</h3>
                    {member.payments.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">No payments yet</p>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {member.payments.map((p) => (
                                <div key={p.id} className="flex justify-between items-center group">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-foreground">
                                            {formatCurrency(p.amount)}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                                            {p.mode}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[12px] text-foreground font-medium">
                                            {formatDate(p.paidAt)}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                            by {p.recordedBy.name}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent check-ins */}
                <div className={cardClass}>
                    <h3 className="text-sm font-bold text-foreground mb-4 opacity-80 uppercase tracking-tight">Recent check-ins</h3>
                    {member.checkins.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">No check-ins yet</p>
                    ) : (
                        <div className="flex flex-col gap-3.5">
                            {member.checkins.map((c) => (
                                <div key={c.id} className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <span className="text-sm text-foreground font-medium">
                                            {new Date(c.checkedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-muted-foreground font-medium">
                                            {new Date(c.checkedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20">
                                            {c.method}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}

