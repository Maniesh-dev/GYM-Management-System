import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { EditMemberForm } from '@/components/members/EditMemberForm'
import { Unauthorized } from '@/components/Unauthorized'
import Link from 'next/link'

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (session!.user.role === 'TRAINER') {
    return <Unauthorized />
  }

  const gymId = session!.user.gymId
  const { id } = await params

  const [member, plans, trainers] = await Promise.all([
    prisma.member.findUnique({
      where: { id, gymId },
    }),
    prisma.plan.findMany({
      where: { gymId, isActive: true },
      orderBy: { price: 'asc' },
    }),
    prisma.user.findMany({
      where: { gymId, role: 'TRAINER' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!member) notFound()

  return (
    <div className="p-7 md:p-8 max-w-[680px]">
      <div className="flex items-center gap-2 mb-6 text-[13px] text-muted-foreground">
        <Link href="/dashboard/members" className="text-muted-foreground no-underline hover:text-foreground transition-colors">
          Members
        </Link>
        <span>/</span>
        <Link
          href={`/dashboard/members/${member.id}`}
          className="text-muted-foreground no-underline hover:text-foreground transition-colors"
        >
          {member.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">Edit</span>
      </div>

      <h1 className="text-[22px] font-bold m-0 mb-6 text-foreground">
        Edit member
      </h1>

      <div className="bg-card border border-border rounded-xl p-7">
        <EditMemberForm
          member={member}
          plans={plans}
          trainers={trainers}
        />
      </div>
    </div>
  )
}

