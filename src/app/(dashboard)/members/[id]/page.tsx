import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { formatDate, formatCurrency, daysUntil } from '@/lib/utils'
import { MemberQRCard } from '@/components/members/MemberQRCard'
import { MemberStatusActions } from '@/components/members/MemberStatusActions'
import { PaymentFormDialog } from '@/components/billing/PaymentForm'

export default async function MemberProfilePage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const session = await auth()
    const { id } = await params

    const member = await prisma.member.findUnique({
        where: { id, gymId: session!.user.gymId },
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
        ACTIVE: '#1D9E75', EXPIRED: '#E24B4A', FROZEN: '#378ADD', CANCELLED: '#888780',
    }

    const card: React.CSSProperties = {
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 12, padding: '20px 24px',
    }

    const canBill = ['OWNER', 'RECEPTION'].includes(session!.user.role)

    return (
        <div style={{ padding: '28px 32px', maxWidth: 900 }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                        <h1 style={{ fontSize: 24, fontWeight: 600 }}>{member.name}</h1>
                        <span style={{
                            fontSize: 11, padding: '3px 10px', borderRadius: 4, fontWeight: 600,
                            background: STATUS_COLOR[member.status] + '20',
                            color: STATUS_COLOR[member.status],
                        }}>
                            {member.status}
                        </span>
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                        {member.phone} {member.email ? `· ${member.email}` : ''}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    {canBill && (
                        <PaymentFormDialog
                            members={[{ id: member.id, name: member.name, phone: member.phone, planId: member.planId }]}
                            plans={await prisma.plan.findMany({ where: { gymId: session!.user.gymId, isActive: true } })}
                            preselectedMemberId={member.id}
                        />
                    )}
                    <MemberStatusActions memberId={member.id} currentStatus={member.status} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

                {/* Membership info */}
                <div style={card}>
                    <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>Membership</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                        {[
                            ['Plan', member.plan.name],
                            ['Joined', formatDate(member.joinDate)],
                            ['Expires', formatDate(member.expiryDate)],
                            ['Days left', member.status === 'ACTIVE' ? `${daysUntil(member.expiryDate)} days` : '—'],
                            ['Trainer', member.trainer?.name ?? 'Not assigned'],
                        ].map(([label, value]) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                                <span style={{ fontWeight: 500 }}>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* QR code */}
                <div style={card}>
                    <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>Entry QR code</h3>
                    <MemberQRCard memberId={member.id} memberName={member.name} qrToken={member.qrToken} />
                </div>

            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                {/* Recent payments */}
                <div style={card}>
                    <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>Payment history</h3>
                    {member.payments.length === 0 ? (
                        <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>No payments yet</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {member.payments.map((p) => (
                                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                    <div>
                                        <span style={{ fontWeight: 500 }}>{formatCurrency(p.amount)}</span>
                                        <span style={{ color: 'var(--color-text-secondary)', marginLeft: 8 }}>{p.mode}</span>
                                    </div>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>
                                        {formatDate(p.paidAt)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent check-ins */}
                <div style={card}>
                    <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>Recent check-ins</h3>
                    {member.checkins.length === 0 ? (
                        <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>No check-ins yet</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {member.checkins.map((c) => (
                                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>
                                        {new Date(c.checkedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                    </span>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>
                                        {new Date(c.checkedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span style={{ fontSize: 11, color: '#1D9E75' }}>{c.method}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}
