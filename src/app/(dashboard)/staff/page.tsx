import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Unauthorized } from '@/components/Unauthorized'

export default async function StaffPage() {
    const session = await auth()

    if (session!.user.role === 'TRAINER') {
        return <Unauthorized />
    }

    const gymId = session!.user.gymId

    const staff = await prisma.user.findMany({
        where: { gymId, isActive: true },
        orderBy: { role: 'asc' },
    })

    const roles: Record<string, string> = {
        OWNER: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800',
        RECEPTION: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20',
        TRAINER: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20',
    }

    return (
        <div className="p-4 md:p-7 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-7">
                <div>
                    <h1 className="text-[22px] font-bold text-foreground m-0 mb-1">Staff Management</h1>
                    <p className="text-[13px] text-muted-foreground m-0">View and manage your gym staff and trainers.</p>
                </div>
                <Link
                    href="/dashboard/staff/new"
                    className="px-5 py-2.5 rounded-lg bg-foreground text-background no-underline text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                    + Add staff
                </Link>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full border-collapse text-left text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/50">
                            <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Name</th>
                            <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Role</th>
                            <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Email</th>
                            <th className="p-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {staff.map((s) => (
                            <tr key={s.id} className="hover:bg-muted/30 transition-colors group">
                                <td className="p-4">
                                    <p className="font-semibold text-foreground m-0">{s.name}</p>
                                    <p className="text-xs text-muted-foreground m-0 mt-0.5">{s.phone || '—'}</p>
                                </td>
                                <td className="p-4">
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${roles[s.role]}`}>
                                        {s.role}
                                    </span>
                                </td>
                                <td className="p-4 text-muted-foreground">{s.email}</td>
                                <td className="p-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link href={`/dashboard/staff/${s.id}/edit`} className="text-xs font-semibold text-foreground hover:underline">Edit</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

