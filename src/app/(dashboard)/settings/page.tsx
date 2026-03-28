import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Unauthorized } from '@/components/Unauthorized'

export default async function SettingsPage() {
  const session = await auth()
  
  if (session!.user.role === 'TRAINER') {
    return <Unauthorized />
  }

  const gymId = session!.user.gymId
  const gym = await prisma.gym.findUnique({
    where: { id: gymId },
  })

  if (!gym) notFound()

  return (
    <div className="p-7 max-w-[600px]">
      <div className="mb-7">
        <h1 className="text-[22px] font-bold m-0 mb-1 text-foreground">
          Gym Settings
        </h1>
        <p className="text-sm text-muted-foreground m-0">
          Manage your gym profile and business details.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-7 flex flex-col gap-6">
        <div>
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-2 opacity-60">Gym Name</label>
          <div className="px-4 py-2.5 rounded-lg border border-border bg-muted/30 text-sm font-medium text-foreground">
            {gym.name}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5 opacity-60">Subscription</label>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 tracking-wider">
              {gym.plan}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-border mt-2">
          <p className="text-[13px] text-muted-foreground leading-relaxed m-0">
            For major changes or billing inquiries, please contact support.
          </p>
        </div>
      </div>
    </div>
  )
}
走走