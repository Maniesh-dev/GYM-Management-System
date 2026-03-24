'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useRole } from '@/hooks/useRole'
import { ModeToggle } from '@/components/ModeToggle'
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react'

const NAV = [
    { label: 'Dashboard', href: '/dashboard', permission: null },
    { label: 'Members', href: '/dashboard/members', permission: 'members:read' },
    { label: 'Attendance', href: '/dashboard/staff/attendance', permission: 'staff:manage' },
    { label: 'Check-ins', href: '/dashboard/checkins', permission: 'checkins:read' },
    { label: 'Billing', href: '/dashboard/billing', permission: 'billing:read' },
    { label: 'Staff', href: '/dashboard/staff', permission: 'staff:manage' },
    { label: 'Reports', href: '/dashboard/reports', permission: 'reports:read' },
    { label: 'Settings', href: '/dashboard/settings', permission: 'settings:manage' },
] as const

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { can, role } = useRole()

    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    useEffect(() => {
        setIsMobileOpen(false)
    }, [pathname])

    const visible = NAV.filter(
        item => item.permission === null || can(item.permission)
    )

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-background border-b border-border sticky top-0 z-40">
                <div onClick={() => router.push('/dashboard')} className="font-bold text-lg text-foreground cursor-pointer text-2xl">
                    Fight Club
                </div>
                <button onClick={() => setIsMobileOpen(true)} className="p-2 -mr-2 text-muted-foreground hover:bg-muted rounded-md transition-colors">
                    <Menu className="w-5 h-5" />
                </button>
            </div>

            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed md:sticky top-0 left-0 z-50 h-[100dvh] bg-background border-r border-border flex flex-col transition-all duration-300 ease-in-out shrink-0
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    ${isCollapsed ? 'md:w-[80px]' : 'md:w-[220px] w-[280px]'}
                `}
            >
                {/* Desktop Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden md:flex absolute -right-3 top-8 w-6 h-6 bg-background border border-border rounded-full items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-50 cursor-pointer"
                >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>

                {/* Mobile Close Button */}
                <button
                    onClick={() => setIsMobileOpen(false)}
                    className="md:hidden absolute right-4 top-4 p-2 text-muted-foreground hover:bg-muted rounded-md cursor-pointer transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Logo */}
                <div onClick={() => router.push('/dashboard')} className={`p-6 pb-5 border-b border-border cursor-pointer flex flex-col ${isCollapsed ? 'items-center px-2' : ''}`}>
                    <div className={`font-bold text-foreground overflow-hidden whitespace-nowrap transition-all ${isCollapsed ? 'text-sm' : 'text-lg'}`}>
                        {isCollapsed ? 'FC' : 'Fight Club'}
                    </div>
                    {!isCollapsed && (
                        <div className="text-[11px] text-muted-foreground mt-0.5 whitespace-nowrap">
                            {role}
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
                    {visible.map(item => {
                        const active = pathname === item.href || (
                            item.href !== '/dashboard' &&
                            pathname.startsWith(item.href) &&
                            !visible.some(other => other.href !== item.href && pathname.startsWith(other.href) && other.href.length > item.href.length)
                        )
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={item.label}
                                className={`flex items-center rounded-lg text-sm no-underline transition-colors ${isCollapsed ? 'justify-center p-3' : 'px-3.5 py-2'} ${active ? 'font-semibold bg-secondary text-secondary-foreground shadow-sm' : 'font-normal bg-transparent text-muted-foreground/80 hover:bg-muted hover:text-foreground'}`}
                            >
                                {isCollapsed ? (
                                    <span className="font-semibold text-xs tracking-wider">{item.label.substring(0, 2).toUpperCase()}</span>
                                ) : (
                                    <span className="truncate">{item.label}</span>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Kiosk link + Logout */}
                <div className={`p-3 border-t border-border flex flex-col gap-1 ${isCollapsed ? 'items-center px-1' : ''}`}>
                    <div className={`flex items-center ${isCollapsed ? 'justify-center mb-1' : 'justify-between px-3.5 py-1'}`}>
                        {!isCollapsed && <span className="text-sm text-muted-foreground whitespace-nowrap">Theme</span>}
                        <ModeToggle />
                    </div>
                    <Link
                        href="/kiosk"
                        target="_blank"
                        title="Open Scanner"
                        className={`block rounded-lg text-sm text-muted-foreground no-underline hover:bg-muted hover:text-foreground transition-colors ${isCollapsed ? 'p-3 flex justify-center' : 'px-3.5 py-2'}`}
                    >
                        {isCollapsed ? '↗' : 'Open Scanner ↗'}
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        title="Sign out"
                        className={`rounded-lg border-none bg-transparent text-sm text-muted-foreground cursor-pointer hover:bg-muted hover:text-foreground transition-colors ${isCollapsed ? 'p-3 flex justify-center' : 'w-full px-3.5 py-2 text-left'}`}
                    >
                        {isCollapsed ? '⎋' : 'Sign out'}
                    </button>
                </div>
            </aside>
        </>
    )
}