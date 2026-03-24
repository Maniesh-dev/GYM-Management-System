import { auth }     from '@/lib/auth'
import { prisma }   from '@/lib/db'
import { notFound } from 'next/navigation'
import { EditMemberForm } from '@/components/members/EditMemberForm'
import Link               from 'next/link'

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const gymId   = session!.user.gymId
  const { id }  = await params

  const [member, plans, trainers] = await Promise.all([
    prisma.member.findUnique({
      where: { id, gymId },
    }),
    prisma.plan.findMany({
      where:   { gymId, isActive: true },
      orderBy: { price: 'asc' },
    }),
    prisma.user.findMany({
      where:   { gymId, role: 'TRAINER' },
      select:  { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!member) notFound()

  return (
    <div style={{ padding: '28px 32px', maxWidth: 680 }}>
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        8,
        marginBottom: 24,
        fontSize:   13,
        color:      '#888',
      }}>
        <Link href="/dashboard/members" style={{ color: '#888', textDecoration: 'none' }}>
          Members
        </Link>
        <span>/</span>
        <Link
          href={`/dashboard/members/${member.id}`}
          style={{ color: '#888', textDecoration: 'none' }}
        >
          {member.name}
        </Link>
        <span>/</span>
        <span style={{ color: '#1a1a1a' }}>Edit</span>
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
        Edit member
      </h1>

      <div style={{
        background:   '#fff',
        border:       '0.5px solid #e8e5dd',
        borderRadius: 14,
        padding:      '28px 32px',
      }}>
        <EditMemberForm
          member={member}
          plans={plans}
          trainers={trainers}
        />
      </div>
    </div>
  )
}
