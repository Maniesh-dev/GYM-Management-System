import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getISTStartOfDay, getISTDate } from '@/lib/utils'
import { KPICard } from '@/components/dashboard/KPICard'
import { ExpiringList } from '@/components/dashboard/ExpiringList'
import { RecentCheckins } from '@/components/dashboard/RecentCheckins'
import { QuickActions } from '@/components/dashboard/QuickActions'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await auth()
  const gymId = session!.user.gymId
  const isTrainer = session!.user.role === 'TRAINER'

  // Use IST-corrected current date for display/greeting
  const now = getISTDate()
  // Use UTC Date that corresponds to 00:00:00 IST for Prisma queries
  const todayStart = getISTStartOfDay()

  const missingCutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
  const weekFromNowEnd = new Date(todayStart.getTime() + 8 * 24 * 60 * 60 * 1000 - 1)

  const [
    totalMembers,
    activeMembers,
    assignedMembers,
    expiredMembers,
    missingMembersCount,
    missingMembers,
    expiringSoon,
    todayCheckins,
  ] = await Promise.all([
    prisma.member.count({ where: { gymId } }),
    prisma.member.count({ where: { gymId, status: 'ACTIVE' } }),
    isTrainer
      ? prisma.member.count({ where: { gymId, trainerId: session!.user.id } })
      : Promise.resolve(0),
    prisma.member.count({ where: { gymId, status: 'EXPIRED' } }),
    isTrainer
      ? Promise.resolve(0)
      : prisma.member.count({
        where: {
          gymId,
          status: 'ACTIVE',
          checkins: {
            none: { checkedAt: { gte: missingCutoff } },
          },
        },
      }),
    isTrainer
      ? Promise.resolve([])
      : prisma.member.findMany({
        where: {
          gymId,
          status: 'ACTIVE',
          checkins: {
            none: { checkedAt: { gte: missingCutoff } },
          },
        },
        include: {
          checkins: {
            orderBy: { checkedAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    prisma.member.findMany({
      where: {
        gymId,
        status: 'ACTIVE',
        expiryDate: { gte: todayStart, lte: weekFromNowEnd },
      },
      include: { plan: { select: { name: true } } },
      orderBy: { expiryDate: 'asc' },
      take: 8,
    }),
    prisma.checkin.findMany({
      where: {
        member: { gymId },
        checkedAt: { gte: todayStart },
      },
      include: { member: { select: { name: true } } },
      orderBy: { checkedAt: 'desc' },
      take: 8,
    }),
  ])

  const hour = now.getHours()
  const greeting =
    hour < 12 ? 'Good morning' :
      hour < 17 ? 'Good afternoon' : 'Good evening'

  const cardClass = "bg-card border border-border rounded-xl p-5"

  return (
    <div className="p-4 md:p-7 max-w-[1100px] mx-auto">

      {/* Greeting */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-foreground m-0 mb-1">
          {greeting}, {session!.user.name?.split(' ')[0]} 👋
        </h1>
        <div className="flex items-center text-sm text-muted-foreground m-0">
          <span>
            {now.toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <KPICard
          label={isTrainer ? 'Assigned members' : 'Active members'}
          value={isTrainer ? assignedMembers : activeMembers}
          sub={`${totalMembers} total`}
          color="#1D9E75"
        />
        {!isTrainer && (
          <KPICard
            label="Missing members"
            value={missingMembersCount}
            sub="> 3 days no check-in"
            color="#534AB7"
          />
        )}
        <KPICard
          label="Today's check-ins"
          value={todayCheckins.length}
          sub="members entered today"
          color="#185FA5"
        />
        <KPICard
          label="Expired memberships"
          value={expiredMembers}
          sub="need renewal"
          color="#E24B4A"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

        {/* Expiring this week */}
        <div className={cardClass}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[15px] font-bold text-foreground m-0 flex items-center">
              Expiring this week
              <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${expiringSoon.length > 0
                ? 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                : 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400'
                }`}>
                {expiringSoon.length}
              </span>
            </h2>
            <Link
              href="/dashboard/members/expired"
              className="text-xs text-muted-foreground no-underline hover:text-foreground transition-colors"
            >
              View all &rarr;
            </Link>
          </div>
          <ExpiringList members={expiringSoon} />
        </div>

        {/* Quick actions */}
        {!isTrainer && (
          <div className={cardClass}>
            <h2 className="text-[15px] font-bold text-foreground m-0 mb-4">
              Quick actions
            </h2>
            <QuickActions />
          </div>
        )}

      </div>

      {!isTrainer && (
        <div className={`${cardClass} mb-5`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold text-foreground m-0 flex items-center">
              Missing members (&gt;3 days)
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                {missingMembers.length}
              </span>
            </h2>
            <Link
              href="/dashboard/members/missing"
              className="text-xs text-muted-foreground no-underline hover:text-foreground transition-colors"
            >
              View all &rarr;
            </Link>
          </div>
          {missingMembers.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground text-sm border border-dashed border-border rounded-lg m-0">
              No missing members
            </p>
          ) : (
            <div className="space-y-3">
              {missingMembers.map((m) => (
                <Link
                  key={m.id}
                  href={`/dashboard/members/${m.id}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors no-underline"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate m-0">{m.name}</p>
                    <p className="text-[11px] text-muted-foreground m-0 mt-1">
                      Last check-in: {m.checkins[0] ? new Date(m.checkins[0].checkedAt).toLocaleDateString('en-IN') : 'Never'}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-primary whitespace-nowrap">View →</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Today's check-ins full list */}
      <div className={cardClass}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[15px] font-bold text-foreground m-0 flex items-center">
            Today&apos;s check-ins
            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400">
              {todayCheckins.length}
            </span>
          </h2>
          <a
            href="/dashboard/checkins"
            className="text-xs text-muted-foreground no-underline hover:text-foreground transition-colors"
          >
            View all &rarr;
          </a>
        </div>
        <RecentCheckins checkins={todayCheckins} />
      </div>

    </div>
  )
}
