import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Unauthorized } from '@/components/Unauthorized'
import { formatDate, getISTDate } from '@/lib/utils'

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000
const ONE_DAY_MS = 24 * 60 * 60 * 1000

export default async function MissingMembersPage() {
  const session = await auth()

  if (!['OWNER', 'RECEPTION'].includes(session!.user.role)) {
    return <Unauthorized />
  }

  const now = getISTDate()
  const cutoff = new Date(now.getTime() - THREE_DAYS_MS)

  const members = await prisma.member.findMany({
    where: {
      gymId: session!.user.gymId,
      status: 'ACTIVE',
      checkins: {
        none: {
          checkedAt: { gte: cutoff },
        },
      },
    },
    include: {
      plan: { select: { name: true } },
      trainer: { select: { name: true } },
      checkins: {
        orderBy: { checkedAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const missingMembers = members
    .map((member) => {
      const lastCheckin = member.checkins[0]?.checkedAt ?? null
      const sinceDate = lastCheckin ?? member.joinDate
      const missingDays = Math.floor((now.getTime() - new Date(sinceDate).getTime()) / ONE_DAY_MS)
      return { ...member, lastCheckin, missingDays }
    })
    .sort((a, b) => b.missingDays - a.missingDays)

  return (
    <div className="p-4 md:p-7 max-w-[1000px]">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-foreground m-0 mb-1">Missing Members</h1>
        <p className="text-[13px] text-muted-foreground m-0">
          {missingMembers.length} members have not checked in for more than 3 days
        </p>
      </div>

      {missingMembers.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-xl p-12 text-center text-muted-foreground text-sm">
          No missing members right now
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full border-collapse text-[13px] min-w-[760px]">
            <thead>
              <tr className="bg-muted border-b border-border">
                {['Member', 'Plan', 'Trainer', 'Last check-in', 'Missing days', 'Profile'].map((h) => (
                  <th key={h} className="p-3.5 text-left font-medium text-xs text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {missingMembers.map((member) => (
                <tr key={member.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4 align-middle">
                    <p className="font-semibold text-foreground m-0">{member.name}</p>
                    <p className="text-[11px] text-muted-foreground m-0 mt-1">{member.phone}</p>
                  </td>
                  <td className="p-4 align-middle text-muted-foreground">{member.plan.name}</td>
                  <td className="p-4 align-middle text-muted-foreground">{member.trainer?.name ?? 'Not assigned'}</td>
                  <td className="p-4 align-middle text-muted-foreground">
                    {member.lastCheckin ? formatDate(member.lastCheckin) : 'Never'}
                  </td>
                  <td className="p-4 align-middle">
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-bold border border-rose-100 dark:border-rose-900/60">
                      {member.missingDays} days
                    </span>
                  </td>
                  <td className="p-4 align-middle">
                    <Link
                      href={`/dashboard/members/${member.id}`}
                      className="text-[13px] font-semibold text-primary no-underline hover:underline"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
