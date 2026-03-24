import Link from 'next/link'

interface Action {
  label: string
  href: string
  desc: string
  color?: string
}

const ACTIONS: Action[] = [
  {
    label: 'Add new member',
    href: '/dashboard/members/new',
    desc: 'Register a new member',
    color: '#534AB7',
  },
  {
    label: 'Record payment',
    href: '/dashboard/billing',
    desc: 'Cash, UPI, card or cheque',
    color: '#1D9E75',
  },
  {
    label: 'View check-ins',
    href: '/dashboard/checkins',
    desc: "Today's entry log",
    color: '#185FA5',
  },
  {
    label: 'Open Scanner',
    href: '/kiosk',
    desc: 'QR scanner for entry',
    color: '#BA7517',
  },
]

export function QuickActions() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {ACTIONS.map(action => (
        <Link
          key={action.href}
          href={action.href}
          className="flex justify-between items-center p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-border no-underline transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <div>
            <p className="text-sm font-semibold text-foreground m-0 mb-1">
              {action.label}
            </p>
            <p className="text-xs text-muted-foreground m-0">
              {action.desc}
            </p>
          </div>
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-base"
            style={{ 
              background: `${action.color}15`,
              color: action.color 
            }}
          >
            →
          </div>
        </Link>
      ))}
    </div>
  )
}