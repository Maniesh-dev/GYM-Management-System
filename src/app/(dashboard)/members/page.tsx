import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { MemberTable } from '@/components/members/MemberTable'

export default async function MembersPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ search?: string; status?: string }>
}) {
  const session = await auth()
  const gymId = session!.user.gymId
  const searchParams = await searchParamsPromise
  const search = searchParams.search ?? ''
  const status = searchParams.status ?? ''

  const [members, counts] = await Promise.all([
    prisma.member.findMany({
      where: {
        gymId,
        ...(session!.user.role === 'TRAINER'
          ? { trainerId: session!.user.id }
          : {}),
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
          ],
        } : {}),
        ...(status ? { status: status as any } : {}),
      },
      include: {
        plan: { select: { name: true, price: true } },
        trainer: { select: { name: true } },
        _count: { select: { checkins: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.member.groupBy({
      by: ['status'],
      where: { 
        gymId,
        ...(session!.user.role === 'TRAINER' ? { trainerId: session!.user.id } : {})
      },
      _count: true,
    }),
  ])

  const statusCount = Object.fromEntries(
    counts.map(c => [c.status, c._count])
  )

  const canAdd = ['OWNER', 'RECEPTION'].includes(session!.user.role)

  const tabs = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Expired', value: 'EXPIRED' },
    { label: 'Frozen', value: 'FROZEN' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ]

  return (
    <div className="p-4 md:p-7">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-foreground m-0 mb-1">
            Members
          </h1>
          <p className="text-[13px] text-muted-foreground m-0">
            {members.length} result{members.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canAdd && (
          <Link
            href="/dashboard/members/new"
            className="px-5 py-2.5 rounded-lg bg-foreground text-background no-underline text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            + Add member
          </Link>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map(tab => (
          <Link
            key={tab.value}
            href={`/dashboard/members?status=${tab.value}${search ? `&search=${search}` : ''}`}
            className={`px-3.5 py-1.5 rounded-full text-[13px] no-underline border border-border transition-colors ${
              status === tab.value 
                ? 'font-bold bg-foreground text-background' 
                : 'font-normal bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.value && statusCount[tab.value] != null && (
              <span className="ml-1.5 opacity-60 text-xs">
                {statusCount[tab.value]}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Search */}
      <form className="mb-5 flex flex-wrap gap-2.5">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by name or phone..."
          className="flex-1 min-w-[200px] sm:max-w-[320px] px-3.5 py-2.5 rounded-lg border border-border text-sm bg-card text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
        {status && <input type="hidden" name="status" value={status} />}
        <button
          type="submit"
          className="px-4.5 py-2.5 rounded-lg border border-border bg-card text-sm cursor-pointer text-foreground hover:bg-muted transition-colors"
        >
          Search
        </button>
        {search && (
          <Link
            href={`/dashboard/members?status=${status}`}
            className="px-3.5 py-2.5 rounded-lg border border-border bg-card text-[13px] text-muted-foreground no-underline hover:bg-muted hover:text-foreground transition-colors flex items-center justify-center"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <MemberTable members={members as any} />

    </div>
  )
}
