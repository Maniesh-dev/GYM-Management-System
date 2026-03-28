import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { GymProfileForm } from '@/components/settings/GymProfileForm'
import { PlanManager } from '@/components/settings/PlanManager'

export default async function SettingsPage() {
    const session = await auth()
    const gymId = session!.user.gymId

    const [gym, plans] = await Promise.all([
        prisma.gym.findUnique({ where: { id: gymId } }),
        prisma.plan.findMany({ where: { gymId }, orderBy: { price: 'asc' } }),
    ])

    if (!gym) return null

    return (
        <div style={{ padding: '28px 32px', maxWidth: 720 }}>
            <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 28 }}>Settings</h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Gym Profile */}
                <section style={{
                    background: 'var(--color-background-primary)',
                    border: '0.5px solid var(--color-border-tertiary)',
                    borderRadius: 12, padding: '24px',
                }}>
                    <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>Gym profile</h2>
                    <GymProfileForm gym={gym} />
                </section>

                {/* Plan management */}
                <section style={{
                    background: 'var(--color-background-primary)',
                    border: '0.5px solid var(--color-border-tertiary)',
                    borderRadius: 12, padding: '24px',
                }}>
                    <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>Membership plans</h2>
                    <PlanManager plans={plans} gymId={gymId} />
                </section>

            </div>
        </div>
    )
}