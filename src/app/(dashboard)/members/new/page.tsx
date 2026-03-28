import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { MemberForm } from '@/components/members/MemberForm'
import Link from 'next/link'

export default async function NewMemberPage() {
  const session = await auth()
  const gymId = session!.user.gymId
  const canDiscount = ['OWNER', 'RECEPTION'].includes(session!.user.role)

  const [plans, trainers] = await Promise.all([
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

  return (
    <div className="p-7 max-w-[680px]">
      <div className="flex items-center gap-2 mb-6 text-[13px] text-muted-foreground">
        <Link href="/dashboard/members" className="text-muted-foreground no-underline hover:text-foreground transition-colors">
          Members
        </Link>
        <span>/</span>
        <span className="text-foreground">Add new member</span>
      </div>

      <div className="mb-7">
        <h1 className="text-[22px] font-bold m-0 mb-1 text-foreground">
          Add new member
        </h1>
        <p className="text-sm text-muted-foreground m-0">
          Fill in the details below to register a new member.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-7">
        <MemberForm
          mode="create"
          plans={plans}
          trainers={trainers}
          canDiscount={canDiscount}
        />
      </div>
    </div>
  )
}
