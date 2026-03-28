'use client'
import { useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export function Unauthorized() {
    useEffect(() => {
        toast.error("You are not authorise to assess this information", {
            id: 'unauthorized-toast', // Prevent duplicate toasts
            duration: 4000,
        })
    }, [])

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-6 border border-red-100 dark:border-red-900/50">
                <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>

            <h1 className="text-2xl font-black text-foreground mb-3 tracking-tight">
                Access Denied
            </h1>

            <p className="text-lg text-muted-foreground max-w-md leading-relaxed font-medium mb-8">
                "You are not authorise to assess this information"
            </p>

            <Link
                href="/dashboard"
                className="px-8 py-3 bg-foreground text-background rounded-xl font-black text-sm hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-black/5"
            >
                Return to Dashboard
            </Link>
        </div>
    )
}
