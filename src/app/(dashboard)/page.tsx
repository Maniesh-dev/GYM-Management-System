import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatCurrency, getISTStartOfDay, getISTDate } from '@/lib/utils'
import { KPICard } from '@/components/dashboard/KPICard'
import { ExpiringList } from '@/components/dashboard/ExpiringList'
import { RecentCheckins } from '@/components/dashboard/RecentCheckins'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { Clock } from '@/components/dashboard/Clock'

export default async function DashboardPage() {
  const session = await auth()
  const gymId = session!.user.gymId

  // Use IST-corrected current date for display/greeting
  const now = getISTDate()
  // Use UTC Date that corresponds to 00:00:00 IST for Prisma queries
  const todayStart = getISTStartOfDay()

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [
    totalMembers,
    activeMembers,
    expiredMembers,
    monthRevenue,
    expiringSoon,
    todayCheckins,
  ] = await Promise.all([
    prisma.member.count({ where: { gymId } }),
    prisma.member.count({ where: { gymId, status: 'ACTIVE' } }),
    prisma.member.count({ where: { gymId, status: 'EXPIRED' } }),
    prisma.payment.aggregate({
      where: { member: { gymId }, paidAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.member.findMany({
      where: {
        gymId,
        status: 'ACTIVE',
        expiryDate: { gte: now, lte: weekFromNow },
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <KPICard
          label="Active members"
          value={activeMembers}
          sub={`${totalMembers} total`}
          color="#1D9E75"
        />
        <KPICard
          label="Revenue this month"
          value={formatCurrency(monthRevenue._sum.amount ?? 0)}
          sub={now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          color="#534AB7"
        />
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
          </div>
          <ExpiringList members={expiringSoon} />
        </div>

        {/* Quick actions */}
        <div className={cardClass}>
          <h2 className="text-[15px] font-bold text-foreground m-0 mb-4">
            Quick actions
          </h2>
          <QuickActions />
        </div>

      </div>

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
