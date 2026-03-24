import Link from 'next/link'
import { formatDate, daysUntil } from '@/lib/utils'

interface Member {
  id:         string
  name:       string
  phone:      string
  expiryDate: Date
  plan:       { name: string }
}

interface ExpiringListProps {
  members: Member[]
}

export function ExpiringList({ members }: ExpiringListProps) {
  if (members.length === 0) {
    return (
      <p style={{ fontSize: 13, color: '#aaa', margin: 0 }}>
        No expirations this week
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {members.map(m => {
        const days   = daysUntil(m.expiryDate)
        const urgent = days <= 1

        return (
          <Link
            key={m.id}
            href={`/dashboard/members/${m.id}`}
            className="flex justify-between items-center no-underline p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-border transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <div>
              <p className="text-sm font-semibold text-foreground m-0 mb-1">
                {m.name}
              </p>
              <p className="text-xs text-muted-foreground m-0">
                {m.plan.name} · {m.phone}
              </p>
            </div>

            <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shrink-0 ml-3 ${
               urgent     ? 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400'
             : days <= 3 ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400'
             :             'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400'
            }`}>
              {days === 0 ? 'Today'
             : days === 1 ? 'Tomorrow'
             :              `${days} days`}
            </span>
          </Link>
        )
      })}
    </div>
  )
}