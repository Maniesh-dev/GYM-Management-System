import { Sidebar } from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col md:flex-row min-h-[100dvh]">
            <Sidebar />
            <main className="flex-1 bg-zinc-100/50 dark:bg-zinc-950 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}