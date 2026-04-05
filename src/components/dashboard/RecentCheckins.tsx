interface Checkin {
  id: string
  checkedAt: Date
  method: string
  member: { name: string }
}

interface RecentCheckinsProps {
  checkins: Checkin[]
}

export function RecentCheckins({ checkins }: RecentCheckinsProps) {
  if (checkins.length === 0) {
    return (
      <p style={{ fontSize: 13, color: '#aaa', margin: 0 }}>
        No check-ins yet today
      </p>
    )
  }

  const fmtTime = (d: Date) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {checkins.map(c => (
        <div
          key={c.id}
          className="flex justify-between items-center p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-border"
        >
          <p className="text-sm font-semibold text-foreground m-0">
            {c.member.name}
          </p>

          <div className="flex items-center gap-2.5">
            <p className="text-xs text-muted-foreground m-0">
              {fmtTime(c.checkedAt)}
            </p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.method === 'QR'
              ? 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}>
              {c.method}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}