'use client'
import Link from 'next/link'
import { formatDate, daysUntil } from '@/lib/utils'
import { StatusBadge } from './StatusBadge'
import { useRole } from '@/hooks/useRole'

interface Member {
  id: string
  name: string
  phone: string
  status: 'ACTIVE' | 'EXPIRED' | 'FROZEN' | 'CANCELLED'
  expiryDate: Date
  joinDate: Date
  plan: { name: string; price: number }
  trainer: { name: string } | null
  _count: { checkins: number }
}

interface MemberTableProps {
  members: Member[]
}

export function MemberTable({ members }: MemberTableProps) {
  const { role } = useRole()
  const isTrainer = role === 'TRAINER'

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

  return (
    <>
      {/* ── Card grid: visible below lg ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:hidden">
        {members.map(m => {
          const days = daysUntil(m.expiryDate)
          const urgent = m.status === 'ACTIVE' && days >= 0 && days <= 7

          return (
            <div
              key={m.id}
              className="bg-card border border-border rounded-xl flex flex-col overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Card body */}
              <div className="flex flex-col gap-3 p-4 flex-1">

                {/* Name + status row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-[15px] m-0 truncate">
                      {m.name}
                    </p>
                    <p className="text-xs text-muted-foreground m-0 mt-0.5">
                      {m.phone}
                    </p>
                  </div>
                  <StatusBadge status={m.status} />
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[13px]">

                  <div>
                    <p className="text-[11px] text-muted-foreground/70 uppercase tracking-wide font-medium m-0 mb-0.5">
                      Plan
                    </p>
                    <p className="text-foreground/90 font-medium m-0 truncate">{m.plan.name}</p>
                    <p className="text-[11px] text-muted-foreground m-0">₹{m.plan.price}</p>
                  </div>

                  <div>
                    <p className="text-[11px] text-muted-foreground/70 uppercase tracking-wide font-medium m-0 mb-0.5">
                      Expiry
                    </p>
                    <p className={`m-0 font-medium ${urgent ? 'text-red-600 dark:text-red-400' : 'text-foreground/90'}`}>
                      {formatDate(m.expiryDate)}
                    </p>
                    {urgent && (
                      <p className="text-[11px] text-red-600 dark:text-red-400 font-bold m-0">
                        {days === 0 ? 'Expires today' : `${days}d left`}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] text-muted-foreground/70 uppercase tracking-wide font-medium m-0 mb-0.5">
                      Check-ins
                    </p>
                    <p className="text-foreground/90 font-medium m-0">{m._count.checkins}</p>
                  </div>

                  <div>
                    <p className="text-[11px] text-muted-foreground/70 uppercase tracking-wide font-medium m-0 mb-0.5">
                      Trainer
                    </p>
                    <p className="text-foreground/90 font-medium m-0 truncate">
                      {m.trainer?.name ?? (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </p>
                  </div>

                </div>
              </div>

              {/* Card footer — View link */}
              {!isTrainer && (
                <div className="border-t border-border px-4 py-2.5 bg-muted/40">
                  <Link
                    href={`/dashboard/members/${m.id}`}
                    className="text-[13px] font-semibold text-primary no-underline hover:underline"
                  >
                    View →
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Table: visible at lg and above ── */}
      <div className="hidden lg:block bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-border">
              {['Member', 'Plan', 'Status', 'Expiry', 'Check-ins', 'Trainer', !isTrainer && ''].filter(Boolean).map(h => (
                <th
                  key={h as string}
                  className="p-3.5 text-left font-medium text-xs text-muted-foreground whitespace-nowrap bg-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map(m => {
              const days = daysUntil(m.expiryDate)
              const urgent = m.status === 'ACTIVE' && days >= 0 && days <= 7
              const td = 'p-4 border-b border-border align-middle'

              return (
                <tr key={m.id}>

                  {/* Member name + phone */}
                  <td className={td}>
                    <p className="font-semibold text-foreground m-0 mb-1">{m.name}</p>
                    <p className="text-xs text-muted-foreground m-0">{m.phone}</p>
                  </td>

                  {/* Plan */}
                  <td className={td}>
                    <p className="text-foreground/80 m-0 mb-0.5">{m.plan.name}</p>
                    <p className="text-[11px] text-muted-foreground m-0">₹{m.plan.price}</p>
                  </td>

                  {/* Status */}
                  <td className={td}>
                    <StatusBadge status={m.status} />
                  </td>

                  {/* Expiry */}
                  <td className={`${td} whitespace-nowrap`}>
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
                  <td className={`${td} text-muted-foreground text-center`}>
                    {m._count.checkins}
                  </td>

                  {/* Trainer */}
                  <td className={`${td} text-muted-foreground`}>
                    {m.trainer?.name ?? (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>

                  {/* View link */}
                  {!isTrainer && (
                    <td className={td}>
                      <Link
                        href={`/dashboard/members/${m.id}`}
                        className="text-[13px] font-semibold text-primary no-underline whitespace-nowrap hover:underline"
                      >
                        View →
                      </Link>
                    </td>
                  )}

                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}