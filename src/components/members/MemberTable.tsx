import Link from 'next/link'
import { formatDate, daysUntil } from '@/lib/utils'
import { StatusBadge }           from './StatusBadge'

interface Member {
  id:         string
  name:       string
  phone:      string
  status:     'ACTIVE' | 'EXPIRED' | 'FROZEN' | 'CANCELLED'
  expiryDate: Date
  joinDate:   Date
  plan:       { name: string; price: number }
  trainer:    { name: string } | null
  _count:     { checkins: number }
}

interface MemberTableProps {
  members: Member[]
}

export function MemberTable({ members }: MemberTableProps) {
  if (members.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <p className="text-sm text-muted-foreground mb-2 mt-0">
          No members found
        </p>
        <p className="text-[13px] text-muted-foreground/60 m-0">
          Try adjusting your search or filter
        </p>
      </div>
    )
  }

  const thClass = "p-3.5 text-left font-medium text-xs text-muted-foreground whitespace-nowrap bg-muted"
  const tdClass = "p-4 border-b border-border align-middle"

  return (
    <div className="bg-card border border-border rounded-xl overflow-x-auto">
      <table className="w-full border-collapse text-[13px] min-w-[700px]">
        <thead>
          <tr className="border-b border-border">
            <th className={thClass}>Member</th>
            <th className={thClass}>Plan</th>
            <th className={thClass}>Status</th>
            <th className={thClass}>Expiry</th>
            <th className={thClass}>Check-ins</th>
            <th className={thClass}>Trainer</th>
            <th className={thClass}></th>
          </tr>
        </thead>
        <tbody>
          {members.map(m => {
            const days   = daysUntil(m.expiryDate)
            const urgent = m.status === 'ACTIVE' && days >= 0 && days <= 7

            return (
              <tr key={m.id}>

                {/* Member name + phone */}
                <td className={tdClass}>
                  <p className="font-semibold text-foreground m-0 mb-1">
                    {m.name}
                  </p>
                  <p className="text-xs text-muted-foreground m-0">
                    {m.phone}
                  </p>
                </td>

                {/* Plan */}
                <td className={tdClass}>
                  <p className="text-foreground/80 m-0 mb-0.5">{m.plan.name}</p>
                  <p className="text-[11px] text-muted-foreground m-0">
                    ₹{m.plan.price}
                  </p>
                </td>

                {/* Status */}
                <td className={tdClass}>
                  <StatusBadge status={m.status} />
                </td>

                {/* Expiry */}
                <td className={`${tdClass} whitespace-nowrap`}>
                  <p className={`m-0 mb-0.5 ${urgent ? 'text-red-600 dark:text-red-400' : 'text-foreground/80'}`}>
                    {formatDate(m.expiryDate)}
                  </p>
                  {urgent && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 font-bold m-0">
                      {days === 0 ? 'Expires today' : `${days}d left`}
                    </p>
                  )}
                </td>

                {/* Check-in count */}
                <td className={`${tdClass} text-muted-foreground text-center`}>
                  {m._count.checkins}
                </td>

                {/* Trainer */}
                <td className={`${tdClass} text-muted-foreground`}>
                  {m.trainer?.name ?? (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </td>

                {/* View link */}
                <td className={tdClass}>
                  <Link
                    href={`/dashboard/members/${m.id}`}
                    className="text-[13px] font-semibold text-primary no-underline whitespace-nowrap hover:underline"
                  >
                    View →
                  </Link>
                </td>

              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}